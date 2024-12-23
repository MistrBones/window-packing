async function main() {
    const userArgs = process.argv.splice(2);
    var parsedArgs = {};
    for (var i = 0; i < userArgs.length; i++) {
      var argument = userArgs[i];
      if (argument.startsWith("--")) {
        // named argument
        i++;
        parsedArgs[argument.substring(2)] = userArgs[i];
      }
    }
    
    loggingEnabled = false;
    canvasWidth = 0;
    canvasHeight = 0;
    gap = parsedArgs?.gap ?? 0;
    marginVertical = parsedArgs?.marginVertical*2 ?? 0;
    marginHorizontal = parsedArgs?.marginHorizontal*2 ?? 0;
    images = [];
    monitorXOffset = 0;
    monitorYOffset = 0;
    
    var adapterCallback = (windows) => {
        console.error("No adapter callback function was set. Check your adapter function to ensure that adapterCallback is overwritten");
        return;
    }
    
    
    var adapterId = parsedArgs?.adapter;
    var adapter = await importAdapter(adapterId, parsedArgs);

    const outputs = adapter.adapt(parsedArgs);
    monitorXOffset = outputs.xOffset;
    monitorYOffset = outputs.yOffset;
    images = outputs.windows;
    canvasWidth = outputs.canvasWidth;
    canvasHeight = outputs.canvasHeight;
    adapterCallback = adapter.callback;
    
    async function importAdapter(adapterId) {
        if (!adapterId) {
            console.error("An adapter must be specified");
            return;
        }
        else {
            try {

            } catch (error) {
                console.log("Error importing adapter:");
                console.error(error);
            }
            var adapter = await import("./adapters/" + adapterId + ".js");
            return adapter;
            //adapterCallback = adapter.callback;
    
        }
    }
    
    function shuffle(array) {
        let currentIndex = array.length;
    
        // While there remain elements to shuffle...
        while (currentIndex != 0) {
    
            // Pick a remaining element...
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
    
            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]
            ];
        }
    }
    
    
    function getAverageBlockWidth(blocks) {
        var i = 0;
        var total = 0;
        for (const [index, block] of Object.entries(blocks)) {
            total += block.maxWidthRatio;
            i++;
        }
        return total / i;
    }
    
    
    function getTotalSideRatio(blocks) {
        var totalSideRatio = 0;
        for (i = 0; i < blocks.length; i++) {
            totalSideRatio += blocks[i][1].maxWidthRatio;
        }
        return totalSideRatio;
    }
    
    
    function getTotalBlockArea(blocks) {
        var totalArea = 0;
        var blocksArray = Object.entries(blocks);
        for (i = 0; i < blocksArray.length; i++) {
            var blockArea = blocksArray[i][1].maxWidthRatio * blocksArray[i][1].maxHeightRatio;
            totalArea += blockArea;
        }
        return totalArea;
    }
    
    
    function getScalingFactorForBlocks(blocks) {
        var blocksArray = Object.entries(blocks);
        var totalSideRatio = getTotalSideRatio(blocksArray);
        var widthLeft = 1 - totalSideRatio;
    
        // Sometimes we will have an organization of blocks that do not use up either of the axes
        // This will calculate a scale factor to scale up until hitting the X or Y axes bounds
        var gapAbsolute = widthLeft * originalTargetWidth;
        var verticalGap = originalTargetRatio - blocksArray[0][1].maxHeightRatio;
        var verticalGapAbsolute = verticalGap * originalTargetWidth;
    
        var marginRatio = marginHorizontal / canvasWidth;
        var verticalMarginRatio = marginVertical / canvasWidth;
        var horizontalGapAdjusted = gapAbsolute / (1 - marginRatio);
        var verticalGapAdjusted = verticalGapAbsolute / (originalTargetRatio - verticalMarginRatio);

    
        if (horizontalGapAdjusted < verticalGapAdjusted) {
            // we will fill the X dimension before the Y dimension
            var targetWidthRatio = 1;
            return targetWidthRatio / totalSideRatio;
        } else {
            // we will fill the Y dimension before the X dimension
            var targetHeightRatio = originalTargetRatio;
            var totalHeightRatio = blocksArray[0][1].maxHeightRatio;
            return targetHeightRatio / totalHeightRatio;
        }
    }
    
    
    // Global variables (use only within place() function)
    var largestSeenArea = 0;
    var originalPlacedBlocks = false;
    function place(blocks) {
    
    
        // We will be placing images in blocks
        // Some blocks will be combinations of 3+ images
        // We will start by initializing blocks as equal to images to check if we can just greedily place our images
        // We will check if all images will fit when fully scaled to the canvas
    
        var totalSideRatio = 0;
        for (const [index, block] of Object.entries(blocks)) {
    
            if (totalSideRatio > 1) {
                // We dont need to calculate anymore
                break;
            }
    
            var scale_factor = block.ratio / targetRatio;
            block.maxHeightRatio = block.ratio / scale_factor;
            block.maxWidthRatio = 1 / scale_factor;
            totalSideRatio += block.maxWidthRatio;
    
        }
    
        if (totalSideRatio > 1) {
    
            // We would overflow the canvas by placing images side by side at maximum height so we must resize+pack differently
            // Call a function to decide which images to combine into a block. Function will update our map combining two existing blocks into a new block.
    
            var newBlocks = createNewBlock(blocks);
            return place(newBlocks);
        } else {
    
            var averageBlockWidth = getAverageBlockWidth(blocks);
    
            var widthLeft = 1 - totalSideRatio;
            var widthDifference = averageBlockWidth - widthLeft;
            if (true && Math.sign(widthDifference) == -1) {
    
                var blockArea = getTotalBlockArea(blocks);
                var scaleFactor = getScalingFactorForBlocks(blocks);
                var blockArea = blockArea * scaleFactor;
                // we need to calculate a scaling factor to ensure we are comparing end results properly
    
                if (blockArea > largestSeenArea) {
                    // We will save the currently calculated blocks incase this solution is better than the later one
                    logger("Saving better potential solution");
                    originalPlacedBlocks = blocks;
                    largestSeenArea = blockArea;
                }
                // We have a good candidate for canvas resizing
                var magicNumber = Math.abs(widthDifference);
                if (canvasWidth > canvasHeight) {
                    magicNumber = magicNumber * canvasWidth;
                } else {
                    //magicNumber = magicNumber*canvasHeight;
                    magicNumber = magicNumber * (canvasHeight / 10);
                }
    
                magicNumber = magicNumber * targetRatio;
                targetHeight -= magicNumber;
                targetRatio = targetHeight / targetWidth;
    
                map = {};
                blocks = images.reduce(function(map, image) {
                    map[image.index] = image;
                    return map;
                }, {});
    
                return place(blocks);
            }
    
            if (originalPlacedBlocks) {
                // We need to compare current blocks to the original blocks to make sure our new solution is actually better
                var newBlocksArea = getTotalBlockArea(blocks);
                logger("New block area: " + newBlocksArea);
                logger("Original blocks area: " + largestSeenArea);
                if (newBlocksArea < largestSeenArea) {
                    logger("Original solution is better");
                    blocks = originalPlacedBlocks;
                }
            }
    
            // We did not overflow the canvas which means we can now place our blocks
    
            // We might need to scale up our solution. Because searching for better solutions involves decreasing the targetHeight we need to scale our newfound solutions back up to use maximum space
            var scalingFactor = getScalingFactorForBlocks(blocks);
    
    
            var blocksArray = Object.entries(blocks);
            for (i = 0; i < blocksArray.length; i++) {
                blocksArray[i][1].maxHeightRatio = blocksArray[i][1].maxHeightRatio * scalingFactor;
                blocksArray[i][1].maxWidthRatio = blocksArray[i][1].maxWidthRatio * scalingFactor;
            }
    
            // now we need to recalculate the gaps left on the x/y axes so we can properly set our offsets to center the output horizontally and vertically
            var newSideRatio = getTotalSideRatio(blocksArray);
            var widthLeft = 1 - newSideRatio;
            var gapAbsolute = widthLeft * originalTargetWidth;
            var verticalGap = originalTargetRatio - blocksArray[0][1].maxHeightRatio;
            var verticalGapAbsolute = verticalGap * originalTargetWidth;
    
            var yOffset = (marginVertical / 2) + (verticalGapAbsolute / 2) + (1 * gap);
            var xOffset = (marginHorizontal / 2) + (gapAbsolute / 2) + (1 * gap);
    
    
            placed = {
                xOffset: xOffset,
                yOffset: yOffset,
                images: []
            };
    
            // Sort blocks into an array ascending values
            var unsorted = [];
            for (const [index, block] of blocksArray) {
                unsorted.push(block);
            }
    
    
    
    
            // This will actually be an inverse gaussian distribution of the ratios since smaller ratio equates to a wider block width
            var sorted = unsorted.sort((block1, block2) => {
                return block2.ratio - block1.ratio
            });
            var gaussianInput = [...sorted];
            var gaussianArray = [];
            let side = true;
            while (gaussianInput.length) {
                gaussianArray[side ? 'unshift' : 'push'](gaussianInput.pop());
                side = !side;
            }
    
    
            // Here we can select from various sorting methods. 
            // Shuffle = random
            // Gaussian = widest rows in center
            // Or we can skip all sorting and add blocks in whatever order they come in
            var sorted = gaussianArray;
            shuffle(sorted);
    
            // Calculate placed image X and Y positions
            for (var i = 0; i < sorted.length; i++) {
                var block = sorted[i];
                placed.yOffset = yOffset;
                var blockWidth = block.maxWidthRatio * targetWidth;
                placed = sizeAndPositionBlocks(block, blockWidth, placed);
                placed.xOffset = placed.xOffset + blockWidth;
            }
    
            return placed;
    
    
        }
    }
    
    
    function sizeAndPositionBlocks(block, blockWidth, placed) {
        if (block.type == "block") {
            // Not an image, recurse until we reach an image
            var i = 0;
            while (i < block.children.length) {
                var newBlock = block.children[i];
                placed = sizeAndPositionBlocks(newBlock, blockWidth, placed);
                i++;
            }
        } else if (block.type == "image") {
            // Image seen, time to size and place
            var imageWidth = blockWidth;
            var imageHeight = (imageWidth * block.ratio);
            block.finalHeight = imageHeight;
            block.finalWidth = imageWidth;
            block.x = placed.xOffset;
            block.y = placed.yOffset;
            placed.images.push(block);
            placed.yOffset = placed.yOffset + block.finalHeight + 2*gap;
        }
        return placed;
    }
    
    
    // Setting and returning a block of the preferred type allows us to prioritize creating blocks from image blocks, this helps with getting a more equal average image size at the end
    function getClosestRatio(blocks, ratio, preferredBlockType = "image") {
        target = ratio;
        difference = 99999999;
        closestBlock = undefined;
        closestBlockPreferred = undefined;
        for (const [index, block] of Object.entries(blocks)) {
            var newDifference = Math.abs(target - block.ratio);
            if (newDifference < difference) {
                difference = newDifference;
                closestBlock = block;
                if (block.type == preferredBlockType) {
                    closestBlockPreferred = block;
                }
            }
        };
        if (closestBlockPreferred) {
            return closestBlockPreferred
        }
        return closestBlock;
    }
    
    
    function createNewBlock(blocks) {
    
        // Get ready to process our new blocks attributes. We will need to set:
        // block.ratio
        // block.index
        // block.type
        // block.children
    
        var newBlock = {};
        newBlock.children = [];
        var index = "";
        var ratio = 0;
        newBlock.type = "block";
    
        for (i = 0; i < 2; i++) {
            var block = getClosestRatio(blocks, targetRatio, "image");
            if (block) {
                delete blocks[block.index];
                newBlock.children.push(block);
                index += "_" + block.index;
                ratio += block.ratio;
            }
        }
    
        newBlock.index = index;
        newBlock.ratio = ratio;
        blocks[newBlock.index] = newBlock;
        return blocks;
    
    }
    
    function logger(message) {
        if (loggingEnabled) {
            console.log(message);
        }
    }
    
    // Begin main code
    targetHeight = canvasHeight - marginVertical - (gap);
    targetWidth = canvasWidth - marginHorizontal - (gap);
    originalTargetWidth = targetWidth;
    origianlTargetHeight = targetHeight;
    
    // Gives ratio as width:height where height == 1
    targetRatio = targetHeight / targetWidth;
    originalTargetRatio = targetRatio;
    
    i = 0;
    images.forEach((image) => {
    
        // Gives ratio as width:height where height == 1
        var ratio = image.height / image.width;
        image.ratio = ratio;
    
        // We must define the type because later we will be using blocks which are collections of images. This will help us to differentiate images from blocks when its time to place images
        image.type = "image";
    
        // Set an index for later reference
        image.index = "image-" + i;
        i++;
    });

    
    map = {};
    blocks = images.reduce(function(map, image) {
        map[image.index] = image;
        return map;
    }, {});
    
    // Our blocks map is ready for placement
    var placed = place(blocks);
    adapterCallback(placed);
    return;
}

try {
    main();
} catch ( error ) {
    console.log("An error occurred and the script could not be executed");
    console.error(error);
}