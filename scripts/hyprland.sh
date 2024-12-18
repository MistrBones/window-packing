#!/bin/bash
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
    if [[ $line == *"monitor:"* ]]; then
      # Check if window is on the right monitor
      monitor=$(echo $line | grep -oP 'monitor:\s([A-Za-z0-9]+)' | sed 's/monitor:\s*//;s/[()]//g')
      if [[ $monitor == $monitor_id ]]; then 
        if [[ -n "$window_id" ]]; then
        if [[ $floating == 0 ]]; then
          echo $window_id
          hyprctl dispatch togglefloating address:0x"$window_id"
        fi
        else
        echo "No valid window_id found!"
        fi
      fi
    fi
done
# Final output
#echo "${window_ids[@]}"

# All windows have been toggled floating, time to get the window sizes and prepare to send off to the packing binary
