  // Current problems:
  // always results in square (less than optimally packed) outputs
  // is this a real problem its kind of aesthetically nice for what we want
  canvasWidth = 1600;  
  canvasHeight = 900;
  childrenPerBlock = 2;

  gap = 0;
  marginTop = 5;
  marginBottom = 5;
  marginTop += gap;
  marginBottom += gap;

var imageCount = 500;
console.clear();
var imageChoice = [
{width: 100, height: 100},
{width: 512, height: 768},
{width: 768, height: 512}
];

function getRandomInRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


var images = [];

for (i = 0; i < imageCount; i++) {
  // get random number 0 through 2
  var index = getRandomInRange(0, 2);
  var image = structuredClone(imageChoice[index]);
  images.push(image);
}

function getSideRatio() {

}



console.log(images);

  function place(blocks) {

    // We will be placing images in blocks
    // Some blocks will be combinations of multiple images
    // We will start by initializing blocks as equal to images to check if we can just greedily place our images
    // We will check if all images will fit when fully scaled to the canvas

    totalSideRatio = 0;
    for (const [index, block] of Object.entries(blocks)) {
      if (totalSideRatio > 1) {
        // We dont need to calculate anymore
        break;
      }

      // Images must be scaled to fit within the canvas
      // In the case of 16:9 this means that the height of the new image ratio must match X:0.5626
      // lets assume known_ratio = 1
      // 0.5625 * x = known_ratio
      // x = known_ratio/0.5625
      // So we must scale down by a factor of 1.7777777
      // scale_factor = 1.77777
      // divide both the height an width in the ratio by scale_factor
      // so 1:1 -> 0.5625:0.5625
      // this represents the largest 1:1 image that first in a 0.5625:1 container


        var scale_factor = block.ratio/targetRatio;
        block.maxHeightRatio = block.ratio/scale_factor;
        block.maxWidthRatio = 1/scale_factor;
        console.log("max width ratio: " + block.maxWidthRatio);
        console.log("max height ratio: " + block.maxHeightRatio);
        totalSideRatio += block.maxWidthRatio;

    }
  
    if (totalSideRatio > 1) {

      // We would overflow the canvas by placing images side by side at maximum height so we must resize+pack differently
      // Call a function to decide which images to combine into a block. Function will update our map combining two existing blocks into a new block.
       var newBlocks = createNewBlock(blocks);
       return place(newBlocks);
    } else {

      // now it is time to place the blocks. this will involve:
      // figure pseudo-block sizes
      // recursively solve block sizes until reaching images
      // figure block offsets
      // figure image absolute sizes to fit pseudo blocks
      // figure image offsets based on block offset + perviousImageHeight
      // figure the gap left on the edges. divide by 2 and set xOffset to value to center images

      var gap = 1 - totalSideRatio;
      var gapAbsolute = gap*targetWidth;

      var xOffset = 0;
      if (gap != 0) {
        xOffset = gapAbsolute/2;
      }

      var yOffset = 0;
      var verticalMargin = marginTop + marginBottom;
      if (verticalMargin != 0) {
        yOffset = verticalMargin/2;
      }
      

      placed = {
        xOffset: xOffset,
        yOffset: yOffset,
        images: []
      };

      // Sort blocks into an array ascending values
      var unsorted = [];
      for (const [index, block] of Object.entries(blocks)) {
        unsorted.push(block);
      }

      //var sorted = shuffle(unsorted);
      shuffle(unsorted);
      var sorted = unsorted;
      //var sorted = unsorted.sort((block1, block2) => { return block2.ratio - block1.ratio });

      // This will actually be an inverse gaussian distribution of the ratios since smaller ratio equates to a wider block width
      /*
      var gaussianArray = [];
      let side       = true;
      while (sorted.length) {
        gaussianArray[side ? 'unshift' : 'push'](sorted.pop());
        side = !side;
      }
      */

      for (var i = 0; i < sorted.length; i++) {
        var block = sorted[i];
        placed.yOffset = yOffset;
        var blockWidth = block.maxWidthRatio * targetWidth;
        placed = sizeAndPositionBlocks(block, blockWidth, placed);
        placed.xOffset = placed.xOffset + blockWidth;
      }
      
      return placed;
      // We did not overflow the canvas which means we can now place our blocks
      // this will require logic for the following: 
      // converting ratios -> pixel sizes
      // calculating offsets for placing new blocks based on already placed blocks 

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
    }
    else if (block.type == "image") {
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

  function getClosestRatio(blocks, ratio, preferredBlockType="image") {
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

  function getFarthestRatio(blocks, ratio, preferredBlockType="image") {
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
  
  

    // We will need a way to make sure we dont combine blocks with other blocks when it isnt required
    // dont forget to set block.type = "block" when creating a new collection of images
    // when creating a new block we need a decision tree for deciding in which order to combine blocks
    // possible order:
    // we should calculate the currentDifference between the target ratio and the current size. check how much space is saved by creating the new block. if the amount of spaceSaved is greater than the currentDifference then mark as a candidate for block creation. Check other possible block configurations, if the difference between the newSpaceSaved is less than the previous spaceSaved while still satisfying the requirement that spaceSaved > currentDifference then discard the previous block candidate in favor of the new one.
    // if there are no block candidates satisfying the previous criteria then we fall back to choosing a second item for the block with a ratio that most closely matches the targetRatio. this helps ensure minimal downscaling so we can take up as much space as possible
  currentRatioCount = 0;
  // Idea:
  // we could calculate the average width ratio of each block and then choose to get the closest or farthest ratio based on which column is nearest or farthest from the average
  function ratioAlternator(blocks, targetRatio, preferredType) {
    if (true) {
      currentRatioCount++;
      return getClosestRatio(blocks, targetRatio, "image");
    }
    else {
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
      }
      
      else {
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

  targetHeight = canvasHeight - marginTop - marginBottom + gap;
  targetWidth = canvasWidth - (2*gap);

  
  // Gives ratio as width:height where height == 1
  targetRatio = targetHeight / targetWidth;
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
  var blocks = images.reduce(function(map, image) {
    map[image.index] = image;
    return map;
  }, {});

  // Our blocks map is ready for placement
  var placedImages = place(blocks);



      var div = document.createElement("div");
      div.style.width = "100%";
      div.style.height="100%";
      
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
 

    // TODO: 
  // our images can not be rotated
  // our images can be resized
  // we will attempt to resize to fill as much space as possible
  // we will use greedy placement as the starting point
  
  // ideas:
  // Reduce all image sizes to a 1:x aspect ratio to make the math easier to understand
  // set the first image, subtract the width and height from the overall aspect ratio (size of our canvas)
  // so in this case a 100x100 -> 1:1,
  // we cant just subtract to get 15:9 because that is the largest remaining rectangle NOT the total remaining space (would leave and empty column and an empty row adjacent to the placed image
  
  // we can combine blocks in an attempt to create one larger block that more closely matches a desirable aspect ratio
  // for instance, the total canvas can be split into X number of sections where X%2 == 0
  // we can then take the number of sections, calculate the aspect ratios of those sections, then combine blocks to create those sections to minimize the number of blocks that need to be placed/confirmed at a given time
  // we would need to decide on some way to choose a starting place for determining the number of blocks. 
  // we could also use recursion for placement here, once a block or section is placed we can split the remaining space into two separate sections
  // we can use the aspect ratios of the remaining blocks as a heuristic to decide how to do this split (should aspect ratios of the newly created sections be taller or wider? we could decide based on whether we have more tall or wide aspect ratios left to place but this could lead to weird edge cases when the Y space available under a placed block is very small)
  // maybe a better heuristic would be to figure the total possible area that could be filled if all remaining blocks were placed inside each newly created block
  // do this for both blocks to calculate a theoretical maximum
  // track the minimum of blockMax1 and blockMax2, then calculate for the other configuration and track the new minimum. Whichever configuration has the lower minimum blockMax will be discarded
  // now we have a new smaller block to pack. we can start calling the placement function recursively to greedily place the largest image by area, figure out
  // we need to decide if we are going to fill horizontally first or fill vertically first
  // we need to do something to make sure we are filling the MAXIMUM amount of space possible because we could always just size everything down (lame) to fit in one row/column
  
  // we will size everything down to a 1:x aspect ratio
  // we will put images together in blocks and combine blocks to target the canvas aspect ratio

  
  function shuffle(array) {
    let currentIndex = array.length;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  }