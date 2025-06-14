export const adapt = ( args ) => {
    // Get our required arguments and return an error if one isn't seen
    var canvas = args?.container ?? false;
    if (!canvas) {
        throw "No container element provided which is required for script execution";
    }

    var canvasWidth = args?.canvasWidth ?? canvas.clientWidth;
    var canvasHeight = args?.canvasHeight ?? canvas.clientHeight;
    var windows = [];

    for (var i = 0; i < canvas.children.length; i++) {
        var child = canvas.children[i];
        child.setAttribute("data-id", "image-" + i);
        var width = child.getAttribute("data-width");
        var height = child.getAttribute("data-height");
        windows.push({
            index: "image-" + i,
            width: parseInt(width),
            height: parseInt(height)
        });
    }

    return {
        windows: windows,
        canvasWidth: canvasWidth, 
        canvasHeight: canvasHeight
    };
}

export const callback = async(result) => {
    var images = result.blocks.images;
    var container = result.userArgs.container;
    var xOffset = parseInt(result.defaultXOffset);
    xOffset -= result.userArgs.gap;
    var yOffset = parseInt(result.defaultYOffset);
    yOffset -= result.userArgs.gap;
    container.classList.add("window-packing-parent");
    for (var i in images) {
        var image = images[i];
        var imageElement = container.querySelectorAll("*[data-id='" + image.index + "']")[0];
        imageElement.style.width = Math.round(image.finalWidth) + "px";
        imageElement.style.height = Math.round(image.finalHeight) + "px";
        imageElement.style.top = Math.round(image.yOffset) - yOffset + "px";
        imageElement.style.left = Math.round(image.xOffset) - xOffset + "px";
    }
}