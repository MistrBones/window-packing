var monitorXOffset = 0;
var monitorYOffset = 0;

export const adapt = ( args ) => {
    // Get our required arguments and return an error if one isn't seen
    try {
        monitors = JSON.parse(args.monitor);
    }
    catch (error) {
        return;
    }
    try {
        windows = JSON.parse(args.windows);
    }
    catch (error) {
        return;
    }

    try {
        var workspace = JSON.parse(args.activeWorkspace);
    }
    catch (error) {
        return;
    }

    // First get the active monitor
    var monitors = Object.entries(monitors);
    let monitorId = undefined;
    for (var i = 0; i < monitors.length; i++) {
        var monitor = monitors[i][1];
        if (monitor.activeWorkspace.id == workspace) {
            monitorId = monitor.id;
            monitorXOffset = monitor.x;
            monitorYOffset = monitor.y;
            var waybarHeight = parseInt(args?.waybarHeight ?? 0);
            monitorYOffset += (waybarHeight);
            var canvasWidth = monitor.width;
            var canvasHeight = monitor.height - waybarHeight;
            break;
        }
    }
    
    if (typeof(monitorId) === 'undefined') {
      throw new Error("No active monitor found");
    }
    var windows = Object.entries(windows);
    var targetWindows = [];
    for (var i = 0; i < windows.length; i++) {
        let window = windows[i][1];
        if (window.monitor === monitorId && window.workspace.id === workspace) {
            window.width = window.size[0];
            window.height = window.size[1];
            targetWindows.push(window);
        }
    }
    return {
        windows: targetWindows, 
        xOffset: monitorXOffset, 
        yOffset: monitorYOffset, 
        canvasWidth: canvasWidth, 
        canvasHeight: canvasHeight
    };
}

export const callback = async(result) => {
    var commandArray = [];
    var windows = result.blocks;
    for (var i = 0; i < windows.images.length; i++) {
        var window = windows.images[i];
        var width = Math.round(window.finalWidth);
        var height = Math.round(window.finalHeight);
        var address = window.address;
        var resizeCommand = "hyprctl dispatch resizewindowpixel exact " + width + " " + height + ",address:" + address;
        window.xOffset = window.xOffset + monitorXOffset;
        window.yOffset = window.yOffset + monitorYOffset;
        window.xOffset = Math.round(window.xOffset);
        window.yOffset = Math.round(window.yOffset);
        var moveCommand = "hyprctl dispatch movewindowpixel exact " + window.xOffset + " " + window.yOffset + ",address:" + address;

        commandArray.push(resizeCommand);
        commandArray.push(moveCommand);
    }
    const { exec } = await import('child_process');
    commandArray.forEach((command) => {
        
        exec(command);
    });
}