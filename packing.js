var start = window.performance.now();
rngSeed = getRandomInRange(1, 10000);
rngSeed = 25;
canvasWidth = 1600;
canvasHeight = 900;
childrenPerBlock = 2;

gap = 5;
marginVertical = 2*50;
marginVertical += 2*gap;
marginHorizontal = 2*50;
//marginTop += gap;
//marginBottom += gap;

var imageCount = 15;
console.clear();
var imageChoice = [{
        width: 100,
        height: 100
    },
    {
        width: 512,
        height: 768
    },
    {
        width: 768,
        height: 512
    },
    { width: 16, height: 9 },
    { width: 9, height: 16 },
    { width: 4, height: 3 },
    {width: 3, height: 4 },
    {width: 21, height: 9},
    {width: 9, height: 21},
    {width: 16, height: 10},
    {width:10, height: 16},
    {width: 3, height: 2},
    {width: 2, height: 3}
];

function RNG(seed) {
  // LCG using GCC's constants
  this.m = 0x80000000; // 2**31;
  this.a = 1103515245;
  this.c = 12345;

  this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
}
RNG.prototype.nextInt = function() {
  this.state = (this.a * this.state + this.c) % this.m;
  return this.state;
}
RNG.prototype.nextFloat = function() {
  // returns in range [0,1]
  return this.nextInt() / (this.m - 1);
}
RNG.prototype.nextRange = function(start, end) {
  // returns in range [start, end): including start, excluding end
  // can't modulu nextInt because of weak randomness in lower bits
  var rangeSize = end - start;
  var randomUnder1 = this.nextInt() / this.m;
  return start + Math.floor(randomUnder1 * rangeSize);
}
RNG.prototype.choice = function(array) {
  return array[this.nextRange(0, array.length)];
}



rng = new RNG(rngSeed);

function getRandomInRange(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


originalImages = [];

for (i = 0; i < imageCount; i++) {
    // get random number 0 through 2
    var index = rng.nextRange(0, imageChoice.length);
    var image = structuredClone(imageChoice[index]);
    originalImages.push(image);
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
    //console.log("Width left: " + widthLeft);
    
    // Sometimes we will have an organization of blocks that do not use up either of the axes
    // This will calculate a scale factor to scale up until hitting the X or Y axes bounds
    var gapAbsolute = widthLeft * originalTargetWidth;
    var verticalGap = originalTargetRatio - blocksArray[0][1].maxHeightRatio;
    var verticalGapAbsolute = verticalGap * originalTargetWidth;

    //console.log("Vertical gap: " + verticalGapAbsolute);
    //console.log("Horizontal gap: " + gapAbsolute);
    //console.log("Original ratio: " + originalTargetRatio);

    var marginRatio = marginHorizontal / canvasWidth;
    var verticalMarginRatio = marginVertical / canvasWidth;
    var horizontalGapAdjusted = gapAbsolute / (1 - marginRatio);
    var verticalGapAdjusted = verticalGapAbsolute / (originalTargetRatio - verticalMarginRatio);



    //console.log("horizontal gap adjusted: " + horizontalGapAdjusted);
    //console.log("vertical gap adjusted: " + verticalGapAdjusted);

    if (horizontalGapAdjusted < verticalGapAdjusted) {
      // we will fill the X dimension before the Y dimension
      //console.log("X dimension first");
      //console.log(totalSideRatio);
      var targetWidthRatio = 1;
      return targetWidthRatio / totalSideRatio;
      //console.log("Scale factor: " + scaleFactor);
      for (var i = 0; i < blocksArray.length; i++) {
          var block = blocksArray[i][1];
          block.maxWidthRatio = block.maxWidthRatio * scaleFactor;
          block.maxHeightRatio = block.maxHeightRatio * scaleFactor;
      }
    }
    else {
      // we will fill the Y dimension before the X dimension
      //console.log("Y dimension first");
      var targetHeightRatio = originalTargetRatio;
      var totalHeightRatio = blocksArray[0][1].maxHeightRatio;
      return targetHeightRatio / totalHeightRatio;
      for (var i = 0; i < blocksArray.length; i++) {
        var block = blocksArray[i][1];
        block.maxWidthRatio = block.maxWidthRatio * scaleFactor;
        block.maxHeightRatio = block.maxHeightRatio * scaleFactor;
      }
    }
}


targetHeight = canvasHeight - marginVertical  - (gap);
targetWidth = canvasWidth - marginHorizontal - (gap);
originalTargetWidth = targetWidth;
origianlTargetHeight = targetHeight;


// Gives ratio as width:height where height == 1
targetRatio = targetHeight / targetWidth;
originalTargetRatio = targetRatio;


largestSeenArea = 0;
originalPlacedBlocks = false;
function place(blocks) {


    // We will be placing images in blocks
    // Some blocks will be combinations of 3+ images
    // We will start by initializing blocks as equal to images to check if we can just greedily place our images
    // We will check if all images will fit when fully scaled to the canvas

    totalSideRatio = 0;
    for (const [index, block] of Object.entries(blocks)) {
        if (totalSideRatio > 1) {
            // We dont need to calculate anymore
            break;
        }

        var scale_factor = block.ratio / targetRatio;
        block.maxHeightRatio = block.ratio / scale_factor;
        block.maxWidthRatio = 1 / scale_factor;
        //console.log("max width ratio: " + block.maxWidthRatio);
        //console.log("max height ratio: " + block.maxHeightRatio);
        totalSideRatio += block.maxWidthRatio;

    }

    if (totalSideRatio > 1) {

        // We would overflow the canvas by placing images side by side at maximum height so we must resize+pack differently
        // Call a function to decide which images to combine into a block. Function will update our map combining two existing blocks into a new block.

        var newBlocks = createNewBlock(blocks);
        return place(newBlocks);
    } else {

        var averageBlockWidth = getAverageBlockWidth(blocks);
        //console.log("Average block width: " + averageBlockWidth);

        var widthLeft = 1 - totalSideRatio;
        var widthDifference = averageBlockWidth - widthLeft;
        //console.log("Additional width needed to create new row at current size: " + widthDifference);
        //console.log(Math.sign(widthDifference));
        if (true && Math.sign(widthDifference) == -1) {

            var blockArea = getTotalBlockArea(blocks);
            var scaleFactor = getScalingFactorForBlocks(blocks);
            var blockArea = blockArea * scaleFactor;
            // we need to calculate a scaling factor to ensure we are comparing end results properly

            if (blockArea > largestSeenArea) {
                // We will save the currently calculated blocks incase this solution is better than the later one
                console.log("Saving better potential solution");
                originalPlacedBlocks = blocks;
                largestSeenArea = blockArea;
            }
          // We have a good candidate for canvas resizing
          //console.log("Resizing canvas");
          var magicNumber = Math.abs(widthDifference);
          if (canvasWidth > canvasHeight) {
              magicNumber = magicNumber*canvasWidth;
          }
          else {
              //magicNumber = magicNumber*canvasHeight;
              magicNumber = magicNumber * (canvasHeight / 10);
          }
          
          magicNumber = magicNumber * targetRatio;
          targetHeight -= magicNumber;
          //targetHeight -= 20;
          targetRatio = targetHeight / targetWidth;

          map = {};
          blocks = originalImages.reduce(function(map, image) {
              map[image.index] = image;
              return map;
          }, {});

          return place(blocks);
        }

        if (originalPlacedBlocks) {
            // We need to compare current blocks to the original blocks to make sure our new solution is actually better
            var newBlocksArea = getTotalBlockArea(blocks);
            console.log("New block area: " + newBlocksArea);
            console.log("Original blocks area: " + largestSeenArea);
            if (newBlocksArea < largestSeenArea) {
                console.log("Original solution is better");
                blocks = originalPlacedBlocks;
            }
        }

        // We did not overflow the canvas which means we can now place our blocks
        // this will require logic for the following: 
        // converting ratios -> pixel sizes
        // calculating offsets for placing new blocks based on already placed blocks 

        // now it is time to place the blocks. this will involve:
        // figure pseudo-block sizes
        // recursively solve block sizes until reaching images
        // figure block offsets
        // figure image absolute sizes to fit pseudo blocks
        // figure image offsets based on block offset + perviousImageHeight
        // figure the gap left on the edges. divide by 2 and set xOffset to value to center images

        var scalingFactor = getScalingFactorForBlocks(blocks);
        console.log(scalingFactor);

        var blocksArray = Object.entries(blocks);
        for (i = 0; i < blocksArray.length; i++) {
            blocksArray[i][1].maxHeightRatio = blocksArray[i][1].maxHeightRatio*scalingFactor;
            blocksArray[i][1].maxWidthRatio = blocksArray[i][1].maxWidthRatio*scalingFactor;
        }

        // now we need to recalculate the gaps
        var newSideRatio = getTotalSideRatio(blocksArray);
        var widthLeft = 1 - newSideRatio;
        var gapAbsolute = widthLeft * originalTargetWidth;
        var verticalGap = originalTargetRatio - blocksArray[0][1].maxHeightRatio;
        var verticalGapAbsolute = verticalGap * originalTargetWidth;

        var yOffset = (marginVertical / 2) + (verticalGapAbsolute / 2) + (1*gap);
        var xOffset = (marginHorizontal / 2) + (gapAbsolute / 2) + (1*gap);


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

        //var sorted = shuffle(unsorted);
        //shuffle(unsorted);
        //var sorted = unsorted;
        var sorted = unsorted.sort((block1, block2) => { return block2.ratio - block1.ratio });

        // This will actually be an inverse gaussian distribution of the ratios since smaller ratio equates to a wider block width
        
        var gaussianArray = [];
        let side       = true;
        while (sorted.length) {
          gaussianArray[side ? 'unshift' : 'push'](sorted.pop());
          side = !side;
        }
        
       var sorted = gaussianArray;

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
        block.finalHeight = imageHeight - gap;
        block.finalWidth = imageWidth - gap;
        block.x = placed.xOffset;
        block.y = placed.yOffset;
        placed.images.push(block);
        placed.yOffset = placed.yOffset + block.finalHeight + gap;
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

function getFarthestRatio(blocks, ratio, preferredBlockType = "image") {
    target = ratio;
    difference = 0;
    farthestBlock = undefined;
    farthestBlockPreferred = undefined;
    for (const [index, block] of Object.entries(blocks)) {
        var newDifference = Math.abs(target - block.ratio);
        if (newDifference > difference) {
            difference = newDifference;
            farthestBlock = block;
            if (block.type == preferredBlockType) {
                farthestBlockPreferred = block;
            }
        }
    };
    if (farthestBlockPreferred) {
        return farthestBlockPreferred
    }
    return farthestBlock;
}




currentRatioCount = 0;

function ratioAlternator(blocks, targetRatio, preferredType) {
    if (true) {
        currentRatioCount++;
        return getClosestRatio(blocks, targetRatio, "image");
    } else {
        currentRatioCount++;
        return getFarthestRatio(blocks, targetRatio, "image");
    }
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

    for (i = 0; i < childrenPerBlock; i++) {
        if (i % 2 == 0) {
            var block = ratioAlternator(blocks, targetRatio, "image");
        } else {
            var block = ratioAlternator(blocks, targetRatio, "image");
        }
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



// Bein main code


i = 0;
originalImages.forEach((image) => {

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
blocks = originalImages.reduce(function(map, image) {
    map[image.index] = image;
    return map;
}, {});

// Our blocks map is ready for placement
var placedImages = place(blocks);



var div = document.createElement("div");
div.style.width = "100%";
div.style.height = "100%";

var images = placedImages.images;
// Randomly placing for the moment
for (let i = 0; i < images.length; i++) {
    var image = images[i];
    var imageEl = document.createElement("div");
    imageEl.style.height = image.finalHeight + "px";
    imageEl.style.width = image.finalWidth + "px";
    imageEl.style.background = getRandomColor();
    imageEl.style.position = "absolute";
    imageEl.style.top = image.y + "px";
    imageEl.style.left = image.x + "px";
    imageEl.style.opacity = "0.7";
    div.append(imageEl);
}

// draw margins
var margin = document.createElement("div");
margin.style.height = (marginVertical / 2) + "px";
margin.style.width = canvasWidth + "px";
margin.style.background = "#FF0000";
margin.style.position = "absolute";
margin.style.top = "0px";
margin.style.left = "0px";
margin.style.opacity = "0.7";
margin.className = "margin";
div.append(margin);



var margin = margin.cloneNode(true);
margin.style.height = canvasHeight + "px";
margin.style.width = (marginHorizontal / 2) + "px";
div.append(margin);

var margin = margin.cloneNode(true);
margin.style.height = canvasHeight + "px";
margin.style.width = (marginHorizontal / 2) + "px";
margin.style.left = canvasWidth - (marginHorizontal / 2) + "px";
div.append(margin);

var margin = margin.cloneNode(true);
margin.style.left = "0px";

margin.style.top = canvasHeight - (marginVertical / 2) + "px";
margin.style.height = (marginVertical / 2) + "px";
margin.style.width = canvasWidth + "px";
div.append(margin);



var canvas = document.querySelectorAll(".canvas")[0];
canvas.style.height = canvasHeight + "px";
canvas.style.width = canvasWidth + "px";
canvas.innerHTML = "";
canvas.append(div);

// Get ready to place images


function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
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

var end = window.performance.now();
console.log(end - start + " milliseconds");