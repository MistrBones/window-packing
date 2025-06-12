#!/bin/bash
active_workspace=1

mapfile -t monitors_lines < <(hyprctl monitors)
for line in "${monitors_lines[@]}"; do
  if [[ $line == *"Monitor"* ]]; then
    monitor_id=$(echo $line | grep -oP '\(ID\s*(\d+)\)' | tail -n 1 | sed 's/ID\s*//;s/[()]//g')
  fi
  if [[ $line == *"focused"* ]]; then
    if [[ $line == *"yes"* ]]; then
      # We got the active monitor
      break
    fi
  fi
done

mapfile -t client_lines < <(hyprctl clients)
# Loop through each line of the clients
for line in "${client_lines[@]}"; do
  if [[ $line == *"Window"* ]]; then
    window_id=$(echo $line | grep -oP 'Window\s([A-Za-z0-9]+)' | sed 's/Window\s*//;s/[()]//g')
    address="0x"$window_id
  fi
  
  if [[ $line == *"floating"* ]]; then
    floating=$(echo $line | grep -oP 'floating:\s([A-Za-z0-9]+)' | sed 's/floating:\s*//;s/[()]//g')
  fi
  if [[ $line == *"workspace:"* ]] then
    workspace=$(echo $line | grep -oP 'workspace:\s([A-Za-z0-9]+)' | sed 's/workspace:\s*//;s/[()]//g')
  fi
  if [[ $line == *"monitor:"* ]]; then
    # Check if window is on the right monitor
    monitor=$(echo $line | grep -oP 'monitor:\s([A-Za-z0-9]+)' | sed 's/monitor:\s*//;s/[()]//g')

    if [[ $monitor == $monitor_id ]]; then 
      if [[ -n "$window_id" ]]; then
        if [[ $floating == 0 ]]; then
          if [[ $workspace == $active_workspace ]]; then
            echo $window_id
            hyprctl dispatch togglefloating address:0x"$window_id"
          fi
        fi
      fi
    fi
  fi
done
# Final output
#echo "${window_ids[@]}"

# All windows have been toggled floating, time to get the window sizes and prepare to send off to the packing script
monitorJson=$(hyprctl monitors -j)
#echo $monitorJson
json=$(hyprctl clients -j)
adapter="hyprland"
SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd $SCRIPT_DIR
cd ../

node packing.js --monitor "$monitorJson" --windows "$json" --adapter hyprland --gap 20 --marginVertical 0 --marginHorizontal 0 --waybarHeight 50 --activeWorkspace "$active_workspace" --logging false
