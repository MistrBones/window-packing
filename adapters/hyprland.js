var monitorXOffset = 0;
var monitorYOffset = 0;

export const adapt = ( args ) => {
    // Get our required arguments and return an error if one isn't seen
    try {
        monitors = JSON.parse(args.monitor);
    }
    catch (error) {
        console.error("Required argument --monitors not seen");
        return;
    }
    try {
        windows = JSON.parse(args.windows);
    }
    catch (error) {
        console.error("Required argument --windows not seen.");
        return;
    }

    try {
        var workspace = JSON.parse(args.activeWorkspace);
        //console.log(workspace);
    }
    catch (error) {
        console.error("Required argument --activeWorkspace not seen.");
        return;
    }

    // First get the active monitor
    var monitors = Object.entries(monitors);
    let monitorId = undefined;
    for (var i = 0; i < monitors.length; i++) {
        var monitor = monitors[i][1];
        //console.log(monitor);
        if (monitor.id == workspace) {
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
    //console.log(typeof(monitorId));
    if (typeof(monitorId) === 'undefined') {
      throw new Error("No active monitor found");
    }
    //console.log(windows);
    //var windows = Object.entries(windows);
    var windows = [
  {
    address: '0x55ccb44529f0',
    mapped: true,
    hidden: false,
    at: [ 14, 14 ],
    size: [ 2532, 1412 ],
    workspace: { id: 4, name: '4' },
    floating: false,
    pseudo: false,
    monitor: 0,
    class: 'Zoho Mail - Desktop',
    title: 'Inbox - Zoho Mail (nick@nicholas-churchill.com)',
    initialClass: 'Zoho Mail - Desktop',
    initialTitle: 'Zoho Mail - Desktop',
    pid: 2082,
    xwayland: true,
    pinned: false,
    fullscreen: 0,
    fullscreenClient: 0,
    grouped: [],
    tags: [],
    swallowing: '0x0',
    focusHistoryID: 8,
    inhibitingIdle: false,
    xdgTag: '',
    xdgDescription: ''
  },
  {
    address: '0x55ccb44aaa40',
    mapped: true,
    hidden: false,
    at: [ 14, 57 ],
    size: [ 2532, 1369 ],
    workspace: { id: 9, name: '9' },
    floating: false,
    pseudo: false,
    monitor: 0,
    class: 'carla',
    title: 'Carla - noise_removal.carxp',
    initialClass: 'carla',
    initialTitle: 'Carla - noise_removal.carxp',
    pid: 2480,
    xwayland: false,
    pinned: false,
    fullscreen: 0,
    fullscreenClient: 0,
    grouped: [],
    tags: [],
    swallowing: '0x0',
    focusHistoryID: 7,
    inhibitingIdle: false,
    xdgTag: '',
    xdgDescription: ''
  },
  {
    address: '0x55ccb43a4d90',
    mapped: true,
    hidden: false,
    at: [ 14, 57 ],
    size: [ 2532, 1369 ],
    workspace: { id: 5, name: '5' },
    floating: false,
    pseudo: false,
    monitor: 0,
    class: 'steam',
    title: 'Steam',
    initialClass: 'steam',
    initialTitle: 'Steam',
    pid: 3197,
    xwayland: true,
    pinned: false,
    fullscreen: 0,
    fullscreenClient: 0,
    grouped: [],
    tags: [],
    swallowing: '0x0',
    focusHistoryID: 6,
    inhibitingIdle: false,
    xdgTag: '',
    xdgDescription: ''
  },
  {
    address: '0x55ccb45c6910',
    mapped: true,
    hidden: false,
    at: [ 2574, 57 ],
    size: [ 2532, 1369 ],
    workspace: { id: 3, name: '3' },
    floating: false,
    pseudo: false,
    monitor: 1,
    class: 'firefox',
    title: 'Using console colors with Node.js - LogRocket Blog — Mozilla Firefox',
    initialClass: 'firefox',
    initialTitle: 'Mozilla Firefox',
    pid: 10122,
    xwayland: false,
    pinned: false,
    fullscreen: 0,
    fullscreenClient: 0,
    grouped: [],
    tags: [],
    swallowing: '0x0',
    focusHistoryID: 5,
    inhibitingIdle: false,
    xdgTag: '',
    xdgDescription: ''
  },
  {
    address: '0x55ccb45827c0',
    mapped: true,
    hidden: false,
    at: [ 3734, 72 ],
    size: [ 1346, 585 ],
    workspace: { id: 1, name: '1' },
    floating: true,
    pseudo: false,
    monitor: 1,
    class: 'thunar',
    title: 'downloads - Thunar',
    initialClass: 'thunar',
    initialTitle: 'downloads - Thunar',
    pid: 4657,
    xwayland: false,
    pinned: false,
    fullscreen: 0,
    fullscreenClient: 0,
    grouped: [],
    tags: [],
    swallowing: '0x0',
    focusHistoryID: 4,
    inhibitingIdle: false,
    xdgTag: '',
    xdgDescription: ''
  },
  {
    address: '0x55ccb45a3ab0',
    mapped: true,
    hidden: false,
    at: [ 2600, 72 ],
    size: [ 1114, 910 ],
    workspace: { id: 1, name: '1' },
    floating: true,
    pseudo: false,
    monitor: 1,
    class: 'thunar',
    title: 'downloads - Thunar',
    initialClass: 'thunar',
    initialTitle: 'downloads - Thunar',
    pid: 4657,
    xwayland: false,
    pinned: false,
    fullscreen: 0,
    fullscreenClient: 0,
    grouped: [],
    tags: [],
    swallowing: '0x0',
    focusHistoryID: 3,
    inhibitingIdle: false,
    xdgTag: '',
    xdgDescription: ''
  },
  {
    address: '0x55ccb458bb70',
    mapped: true,
    hidden: false,
    at: [ 3734, 677 ],
    size: [ 1346, 902 ],
    workspace: { id: 1, name: '1' },
    floating: true,
    pseudo: false,
    monitor: 1,
    class: 'thunar',
    title: 'downloads - Thunar',
    initialClass: 'thunar',
    initialTitle: 'downloads - Thunar',
    pid: 4657,
    xwayland: false,
    pinned: false,
    fullscreen: 0,
    fullscreenClient: 0,
    grouped: [],
    tags: [],
    swallowing: '0x0',
    focusHistoryID: 2,
    inhibitingIdle: false,
    xdgTag: '',
    xdgDescription: ''
  },
  {
    address: '0x55ccb4559380',
    mapped: true,
    hidden: false,
    at: [ 14, 57 ],
    size: [ 1566, 1369 ],
    workspace: { id: 2, name: '2' },
    floating: false,
    pseudo: false,
    monitor: 0,
    class: 'code-oss',
    title: 'hyprland.js - Code - OSS',
    initialClass: 'code-oss',
    initialTitle: 'Code - OSS',
    pid: 4086,
    xwayland: false,
    pinned: false,
    fullscreen: 0,
    fullscreenClient: 0,
    grouped: [],
    tags: [],
    swallowing: '0x0',
    focusHistoryID: 1,
    inhibitingIdle: false,
    xdgTag: '',
    xdgDescription: ''
  },
  {
    address: '0x55ccb44f3bd0',
    mapped: true,
    hidden: false,
    at: [ 1600, 57 ],
    size: [ 946, 1369 ],
    workspace: { id: 2, name: '2' },
    floating: false,
    pseudo: false,
    monitor: 0,
    class: 'kitty',
    title: './scripts/hyprland-test.sh ',
    initialClass: 'kitty',
    initialTitle: 'kitty',
    pid: 3429,
    xwayland: false,
    pinned: false,
    fullscreen: 0,
    fullscreenClient: 0,
    grouped: [],
    tags: [],
    swallowing: '0x0',
    focusHistoryID: 0,
    inhibitingIdle: false,
    xdgTag: '',
    xdgDescription: ''
  }
];
    var targetWindows = [];
    for (var i = 0; i < windows.length; i++) {
        //let window = windows[i][1];
        let window = windows[i];
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

export const callback = async(windows) => {
    var commandArray = [];
    for (var i = 0; i < windows.images.length; i++) {
        var window = windows.images[i];
        var width = Math.round(window.finalWidth);
        var height = Math.round(window.finalHeight);
        var address = window.address;
        var resizeCommand = "hyprctl dispatch resizewindowpixel exact " + width + " " + height + ",address:" + address;
        console.log("winxow y:" + window.y);
        window.x = window.x + monitorXOffset;
        window.y = window.y + monitorYOffset;
        window.x = Math.round(window.x);
        window.y = Math.round(window.y);
        var moveCommand = "hyprctl dispatch movewindowpixel exact " + window.x + " " + window.y + ",address:" + address;

        commandArray.push(resizeCommand);
        commandArray.push(moveCommand);
    }
    const { exec } = await import('child_process');
    commandArray.forEach((command) => {
        //console.log(command);
        exec(command);
    });
}