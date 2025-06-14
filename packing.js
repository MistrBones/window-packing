// how our ratios work
// all absolute sizes are converted to relative sizes in the form of ratios
// so 1600w x 900h becomes 16:9
// we always represent the width as 1 so we re-calculate that ratio
// so 16:9 -> 1:0.5625

async function main(config={}) {

    function getArguments(config) {
        if (isNodeEnvironment()) {
            // load arguments from process
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
            return parsedArgs;
            
        } else {
            // load arguments from config
            return config;
        }
    }

    var parsedArgs = getArguments(config);
    var loggingEnabled = parsedArgs?.logging ?? false;
    var canvasWidth = 0;
    var canvasHeight = 0;
    var gap = parsedArgs?.gap ?? 0;
    
    var marginVertical = parsedArgs?.marginVertical ?? 0;
    marginVertical *= 2;
    if (marginVertical/2 < gap) {
        marginVertical = gap*2;
    }
    
    var marginHorizontal = parsedArgs?.marginHorizontal ?? 0;
    marginHorizontal *= 2;
    if (marginHorizontal/2 < gap) {
        marginHorizontal = gap*2;
    }

    var images = [];

    
    
    var adapterId = parsedArgs?.adapter;
    var adapter = await importAdapter(adapterId);

    const outputs = adapter.adapt(parsedArgs);

    images = outputs.windows;
    canvasWidth = outputs.canvasWidth;
    canvasHeight = outputs.canvasHeight;
    var adapterCallback = adapter.callback;
    
    // The adapter is responsible for taking the output of this algorithm (an array with a list of final width/height and x/y offsets) and doing something useful with it. For example, this project was initially created with managing windows in Hyprland in mind so we have a hyprland adapter that runs the necessary hyprctl commands to resize/move windows.
    // Using an adapter here keeps the use cases for this algorithm flexible allowing us to implement other window managers or, for example, masonry style layouts for webpages
    async function importAdapter(adapterId) {
        if (!adapterId) {
            return;
        }
        else {
            if (isNodeEnvironment()) {
                // import local adapter
                logger("In node environment", "white", "green");
                var adapterLocation = "./adapters/" + adapterId + ".js";
            } else {
                // import adapter from url
                logger("Not in node environment", "white", "green");
                var adapterLocation = adapterId;
            }

            try {
                var adapter = await import(adapterLocation);
                return adapter;
            } catch (error) {
                logger("Error importing adapter:", "white", "red");
                throw new Error("No adapter could be imported which is required for script execution");
            }
        }
    }
    
    // Shuffles blocks just so we can get different output visually when re-running the algorithm without changing inputs
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
    
    // We need to calculate the average width of all top level blocks so we can determine if there is horizontal space to create a new similarly sized top level pseudo block
    function getAverageBlockWidth(blocks) {
        var i = 0;
        var total = 0;
        for (const [index, block] of Object.entries(blocks)) {
            total += block.maxWidthRatio;
            i++;
        }
        return total / i;
    }
    
    // We calculate the total width of all top level blocks, 1 would be a perfect fit for the canvas width. We use the returned value as part of determining the quality of a finished solution
    function getTotalSideRatio(blocks) {
        var totalSideRatio = 0;
        for (i = 0; i < blocks.length; i++) {
            totalSideRatio += blocks[i][1].maxWidthRatio;
        }
        return totalSideRatio;
    }
    
    // We need to calculate the total height*width of the placed blocks so that we can determine the quality of the current solution
    function getTotalBlockArea(blocks) {
        var totalArea = 0;
        var blocksArray = Object.entries(blocks);
        for (i = 0; i < blocksArray.length; i++) {
            var blockArea = blocksArray[i][1].maxWidthRatio * blocksArray[i][1].maxHeightRatio;
            totalArea += blockArea;
        }
        return totalArea;
    }

    // We need this for determining block orientations when preparing to add our gaps at the end
    function getBlockHeight(blocks) {
        return blocks[0].maxHeightRatio;
    }

    // takes a top level pseudo block and returns how many non-pseudo block children it contains
    // will use this when doing gap calculations
    function getTotalBlockChildren(block, count = 0) {
        if (block.type == "block") {
            // we have a pseudo block
            var children = block.children;
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                count += getTotalBlockChildren(child, 0);
            }
        }
        else if (block.type == "image") {
            count++;
        }
        return count;
    }
    
    
    // A scaling factor is used as part of transforming from relative values to absolute sizes
    // We calculate this instead of calculating directly using the relative value + canvas size because some final solutions will not use the full width and height which allows room for additional scaling.
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

        logger("horizontal gap adjusted: " + horizontalGapAdjusted);
        logger("vertical gap adjusted: " + verticalGapAdjusted);
        if (horizontalGapAdjusted < verticalGapAdjusted) {
            // we will fill the X dimension before the Y dimension
            logger("Filling X dimension first in block scaling factor function", "white", "black");
            var targetWidthRatio = 1;
            return targetWidthRatio / totalSideRatio;
        } else {
            // we will fill the Y dimension before the X dimension
            logger("Filling Y dimension first in block scaling factor function", "white", "black");
            var targetHeightRatio = originalTargetRatio;
            var totalHeightRatio = blocksArray[0][1].maxHeightRatio;
            
            return targetHeightRatio / totalHeightRatio;
        }
    }
    
    // variable initial values (use only within place() function)
    var largestSeenArea = 0;
    var largestSeenWidth = canvasWidth;
    var largestSeenHeight = canvasHeight;
    var previousSolution = false;
    var scalingFactor = 1;
    var defaultYOffset = false;
    var defaultXOffset = false;
    // We will track how many times the place() function is called to ensure we don't get in an infinite loop
    var placeCalledCount = 0;
    var placeCalledMaxCount = 50;
    var renderedHeight = 0;
    var renderedWidth = 0;

    // Handles all logic for taking the current list of blocks and combining them into pseudo-blocks 
    function place(blocks) {
        placeCalledCount++;
        gapRelative = (gap / targetWidth);
    
        // We will be placing images in blocks
        // Some blocks will be combinations of 3+ images
        // We will start by initializing blocks as equal to images to check if we can just greedily place our images
        // We will check if all images will fit when fully scaled to the canvas
    
        var totalSideRatio = 0;
        var length = 0;
        for (const [index, block] of Object.entries(blocks)) {
            var scale_factor = block.ratio / targetRatio;
            //block.maxHeightRatio = block.ratio / scale_factor;
            block.maxHeightRatio = targetRatio;
            block.maxWidthRatio = 1 / scale_factor;
            totalSideRatio += block.maxWidthRatio;
            totalSideRatio += gapRelative;
            length++;
    
        }
        
        if (totalSideRatio > 1 && length > 1) {
    
            // We would overflow the canvas by placing images side by side at maximum height so we must resize+pack differently
            // Call a function to decide which images to combine into a block. Function will update our map combining two existing blocks into a new pseudo block.
            var newBlocks = createNewBlock(blocks);
            return place(newBlocks);
       
        } else {

            // Blocks would not overflow canvas if placed now
            var averageBlockWidth = getAverageBlockWidth(blocks);
            var widthLeft = 1 - totalSideRatio;
            var widthDifference = averageBlockWidth - widthLeft;
            if (true && Math.sign(widthDifference) == -1) {
                // The total unused width in the current solution is greater than the average width of the top level blocks
                // This is a good indication that what we have is a solution that could be improved
                // Even so, we should compare the current solution to the previous best solution
                var blockArea = getTotalBlockArea(blocks);
                var scaleFactor = getScalingFactorForBlocks(blocks);
                var blockArea = blockArea * scaleFactor;
                // we need to calculate a scaling factor to ensure we are comparing end results properly
                if (blockArea > largestSeenArea) {
                    // We will save the currently calculated blocks incase this solution is better than the later one
                    logger("Saving better potential solution");
                    previousSolution = structuredClone(blocks);
                    largestSeenWidth = targetWidth;
                    largestSeenHeight = targetHeight;
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
                
                // We take our newly calculated magic number and subtract it from the target canvas height then rerun the placement algorithm
                // This change in canvas size will cause blocks from previous solutions to use up less horizontal space relatively speaking when scaled to fit the new canvas. This leads to new average block widths which in turn can lead to having enough space for an additional top level pseudo-block
                // We use the magic number to try to find the point at which there is room for a new toplevel pseudo-block in as few steps as possible
                // Doing this allows to search for new placement solutions that may better fill the canvas space

                magicNumber = magicNumber * targetRatio;
                targetHeight -= magicNumber;
                targetRatio = targetHeight / targetWidth;
    
                map = {};
                blocks = images.reduce(function(map, image) {
                    map[image.index] = image;
                    return map;
                }, {});
                
                if (!previousSolution || placeCalledCount < placeCalledMaxCount) {
                    // There is no previous calculated solution and we haven't exceeded the max call count
                    return place(blocks);
                }
            }
    
            if (previousSolution) {
                // We need to compare current blocks to the original blocks to make sure our new solution is actually better
                var newBlocksArea = getTotalBlockArea(blocks);
                logger("New block area: " + newBlocksArea);
                logger("Original blocks area: " + largestSeenArea);
                if (newBlocksArea < largestSeenArea) {
                    logger("Original solution is better, reverting blocks state");
                    
                    
                    blocks = { ...previousSolution };
                    canvasWidth = largestSeenWidth;
                    canvasHeight = largestSeenHeight;
                    targetWidth = largestSeenWidth;
                    targetHeight = largestSeenHeight;
                    targetRatio = largestSeenHeight / largestSeenWidth;
                }
            }
    
            // We did not overflow the canvas which means we can now place our blocks
            // now we need to recalculate the gaps left on the x/y axes so we can properly set our offsets to center the output horizontally and vertically
            var blocksArray = Object.entries(blocks);
            var newSideRatio = getTotalSideRatio(blocksArray);
            var heightLeft = originalTargetRatio - targetRatio;
            var heightLeftConverted = heightLeft / originalTargetRatio;
            var currentWidth = targetWidth * newSideRatio;
            var currentHeight = (currentWidth * targetRatio);


            scalingFactor = getScalingFactorForBlocks(blocks);
            logger("Block scaling factor: " + scalingFactor, "white", "green");
            logger("New side ratio: " + newSideRatio, "white", "green");
            var widthLeft = 1-(newSideRatio * scalingFactor);
            var verticalGap = originalTargetHeight - (currentHeight*(scalingFactor*targetRatio));
            var heightLeft = verticalGap;
            logger("width left; " + widthLeft);
            logger("height left; " + heightLeft);
            var xOffset = (widthLeft * targetWidth * 0.5) + (marginHorizontal/2);
            defaultXOffset = xOffset;
            var yOffset = 0;


            // the xOffset and yOffset properties here will allow to track the cumulative offsets from previously placed blocks once we call the sizeAndPositionBlocks() function
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
            //shuffle(sorted);


            var totalBlocks = sorted.length;
            var gapRelative = (gap / canvasWidth) * originalTargetRatio;
            var gapDifference = gap * (totalBlocks + 1);
            

            // Calculate placed image X and Y positions
            var finalCanvasHeight = canvasHeight - marginVertical - (0*gap);
            var finalCanvasWidth = canvasWidth - marginHorizontal + (1*gap);

            var finalCanvasHeight = canvasHeight - marginVertical - (0*gap);
            var finalCanvasWidth = canvasWidth - marginHorizontal - (0*gap);

            //var finalCanvasHeight = originalTargetHeight - marginVertical - (0*gap);
            //var finalCanvasHeight = canvasHeight - marginVertical - (0*gap);
            var finalCanvasWidth = targetWidth - marginHorizontal - gapDifference + (2*gap);
            var finalCanvasHeight = targetHeight;

            // get original target ratio and current target ratio
            var currentTargetRatio = targetHeight/targetWidth;
            
            if (targetRatio < originalTargetRatio) {
                // run out of height? first
                
                finalCanvasHeight = originalTargetHeight;
                finalCanvasWidth = (finalCanvasHeight / (currentTargetRatio)) + (1*gap);

            }
            else {
                //runs out of the other first
                
                finalCanvasWidth = originalTargetWidth;
                finalCanvasHeight = finalCanvasWidth * currentTargetRatio;
                
            }

            var finalCanvasRatio = finalCanvasHeight/finalCanvasWidth;
            var heightRatioFilled = getBlockHeight(sorted) / finalCanvasRatio;
            

            function scaleBlockToCanvas(block, canvasRatio) {
                var blockHeight = block.maxHeightRatio;
                if (block.maxHeightRatio > canvasRatio) {
                    // scaling down
                    var scalingFactor = canvasRatio / block.maxHeightRatio;
                    block.maxWidthRatio = block.maxWidthRatio * scalingFactor;
                    block.maxHeightRatio = canvasRatio;
                    return block;
                }
                else if (block.maxHeightRatio < canvasRatio){
                    // scaling up??
                    var scalingFactor = block.maxHeightRatio / canvasRatio;
                    block.maxWidthRatio = block.maxWidthRatio * scalingFactor;
                    block.maxHeightRatio = canvasRatio;
                    return block;
                } else {
                    // no scaling?
                    return block
                }
            }

            var blockWidthTally = 0;
            targetRatio = targetHeight / targetWidth;
            for (var i = 0; i < sorted.length; i++) {
                var block = sorted[i];
                
                var totalBlockChildren = getTotalBlockChildren(sorted[i]);
                var blockWidth = 1;
                logger("Width ratio filled: " + newSideRatio);
                logger("Height ratio filled: " + heightRatioFilled);
                var initialMaxWidthRatio = block.maxWidthRatio;
                if (newSideRatio > (1- heightLeftConverted)) {
                    // taking horizontal space
                    logger("Taking horizontal space for gap resizing", "white", "red");           
                    //block.maxWidthRatio = block.maxWidthRatio - ((1.25) * (gapRelative));
                    block.maxWidthRatio = block.maxWidthRatio - ((sorted.length - 1.5) * (gapRelative/block.ratio));
                    blockWidth = block.maxWidthRatio * targetWidth * scalingFactor;
                    blockWidthTally += block.maxWidthRatio;
                }
                else {
                    // taking vertical space
                    logger("Taking vertical space for gap resizing", "white", "red");
                    logger("total block children" + totalBlockChildren);
                    var numGaps = totalBlockChildren;
                    var gapSize = (numGaps  -1)*gap;
                    logger("Gap size: " + gapSize);
                    var gapSizeRelative = (gapSize/originalTargetWidth);
                    logger("Gap size relative: " + gapSizeRelative);
                    block.maxWidthRatio = block.maxWidthRatio - (gapSizeRelative/block.ratio);
                    blockWidthTally += block.maxWidthRatio;
                    blockWidth = (block.maxWidthRatio * originalTargetWidth * scalingFactor);
                }
                if (defaultYOffset === false) {
                    // This will only run for the first block so any operations that need to only happen once will happen here
                    var totalHeight = originalTargetHeight;
                    var currentHeight = blockWidth * block.ratio;
                    var verticalGap = totalHeight - currentHeight;
                    defaultYOffset = (verticalGap/2) + (0.5*marginVertical/2);
                    logger("default y offset: " + defaultYOffset);
                    renderedHeight = initialMaxWidthRatio*targetWidth*block.ratio;
                }

                placed.yOffset = defaultYOffset;
                renderedWidth += blockWidth;
                placed = sizeAndPositionBlocks(block, blockWidth, placed);
                placed.xOffset = placed.xOffset + (gap*1) + (blockWidth);// + gap*2;
            }
            return placed;
        }
    }
    
    // A recursive function to take our finished blocks and convert from relative values to absolute values
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
            block.xOffset = placed.xOffset;
            block.yOffset = placed.yOffset;
            placed.images.push(block);
            placed.yOffset = placed.yOffset + block.finalHeight + 1*gap;
        }
        return placed;
    }
    
    // Finds the block with the ratio that most closely matches the provided `ratio` argument
    // The decision to group blocks this way is mostly arbitrary but it has the benefit of causing block widths to regress towards the mean width of all blocks
    // This helps ensure that our base blocks are similarly sized at the end instead of having some massively undersized or oversized blocks.
    // Setting and returning a block of the preferred type allows us to prioritize creating blocks from image blocks, this helps with getting a more equal average image size at the end
    function getClosestRatio(blocks, ratio, preferredBlockType = "image") {
        var target = ratio;
        var difference = 99999999;
        var closestBlock = undefined;
        var closestBlockPreferred = undefined;
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
    
    // If this function was called it's because the current blocks does not form a valid solution
    // Chooses two blocks to combine into a single new psuedo block
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
    
    function logger(message, fg="white", bg="transparent") {
        if (loggingEnabled) {
            if (!isNodeEnvironment()) {
                console.log("%c " + message, 'color: ' + fg + '; background: ' + bg);
                return;
            }
            console.log(
                getColorANSI(fg, "fg") + getColorANSI(bg, "bg") + message + " \x1b[0m"
            );
        }
    }

    function getColorANSI(color, plane="fg") {
        if (color == "transparent") {
            return "\x1b[0m ";
        }
        var colors = {
            black: 30,
            red: 31,
            green: 32,
            yellow: 33,
            blue: 34,
            magenta: 35,
            cyan: 36,
            white: 37,
        };
        var code = colors[color];
        if (plane == "bg") {
            code += 10;
        }
        return "\x1b[" + code + "m ";
    }
    
    // Begin main code
    var targetHeight = canvasHeight - marginVertical;
    var targetWidth = canvasWidth - marginHorizontal;
    var originalTargetWidth = targetWidth;
    var originalTargetHeight = targetHeight;
    
    // Gives ratio as width:height where height == 1
    var targetRatio = targetHeight / targetWidth;
    var originalTargetRatio = targetRatio;
    
    var i = 0;
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

    
    var map = {};
    var blocks = images.reduce(function(map, image) {
        map[image.index] = image;
        return map;
    }, {});
    
    // Our blocks map is ready for placement
    var placed = place(blocks);
    var result = {
        blocks: placed,
        defaultXOffset: defaultXOffset,
        defaultYOffset: defaultYOffset,
        renderedWidth: renderedWidth,
        renderedHeight: renderedHeight,
        userArgs: parsedArgs
    };
    logger("Place function called " + placeCalledCount + " times");
    adapterCallback(result);
    return;
}

function isNodeEnvironment() {
  return typeof process !== 'undefined' && process.versions && process.versions.node;
}

if (isNodeEnvironment()) {
    try {
        main();
    } catch ( error ) {
        console.error(
            "An error occurred and the script could not be executed"
        );
        
    }
} else {
    // file probably being included in web browser
}

export { main as WindowPacking };