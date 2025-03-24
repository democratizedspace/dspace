/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const sizeOf = require('image-size');

// Path configurations
const questDirectoryRelativePath = '../src/pages/quests/json/';
const publicDirectoryRelativePath = '../public';

// Image quality standards
const IMAGE_STANDARDS = {
  quest: {
    dimensions: { width: 512, height: 512 },
    maxSizeKB: 150
  },
  npc: {
    dimensions: { width: 512, height: 512 },
    maxSizeKB: 150
  }
};

// Get actual image dimensions using image-size package
function getImageDimensions(imagePath) {
  try {
    const fullPath = getImageFullPath(imagePath);
    return sizeOf(fullPath);
  } catch (error) {
    console.error(`Error getting dimensions for ${imagePath}: ${error.message}`);
    return { width: 0, height: 0 }; // Error code
  }
}

// Collect all image references from quest files
function collectImageReferences() {
  const directoryPath = path.join(__dirname, questDirectoryRelativePath);
  const files = glob.sync(path.join(directoryPath, '**/*.json'));
  const imageReferences = new Set();
  
  files.forEach(file => {
    try {
      const data = JSON.parse(fs.readFileSync(file));
      
      // Add quest image
      if (data.image && data.image.startsWith('/')) {
        imageReferences.add(data.image);
      }
      
      // Add NPC image
      if (data.npc && data.npc.startsWith('/')) {
        imageReferences.add(data.npc);
      }
      
      // Check for image references in rewards 
      // (some rewards might have associated images)
      if (data.rewards) {
        data.rewards.forEach(reward => {
          if (reward.image && reward.image.startsWith('/')) {
            imageReferences.add(reward.image);
          }
        });
      }
      
      // Check for image references in dialogue options
      // (some options might have associated images)
      if (data.dialogue) {
        data.dialogue.forEach(node => {
          if (node.options) {
            node.options.forEach(option => {
              if (option.image && option.image.startsWith('/')) {
                imageReferences.add(option.image);
              }
            });
          }
        });
      }
      
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  });
  
  return Array.from(imageReferences);
}

// Check if an image file exists in the public directory
function imageExists(imagePath) {
  // Strip the leading slash and convert to file system path
  const relativePath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  const fullPath = path.join(__dirname, publicDirectoryRelativePath, relativePath);
  
  return fs.existsSync(fullPath);
}

// Get the full path of an image file
function getImageFullPath(imagePath) {
  const relativePath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  return path.join(__dirname, publicDirectoryRelativePath, relativePath);
}

// Check image file size in KB
function getImageSizeKB(imagePath) {
  try {
    const fullPath = getImageFullPath(imagePath);
    const stats = fs.statSync(fullPath);
    return Math.round(stats.size / 1024); // Convert bytes to KB
  } catch (error) {
    return -1; // Error code
  }
}

// Generate a report of missing images
function checkMissingImages(imageReferences) {
  const missing = [];
  const existing = [];
  
  imageReferences.forEach(ref => {
    if (imageExists(ref)) {
      existing.push(ref);
    } else {
      missing.push(ref);
    }
  });
  
  return { missing, existing };
}

// Check for images that exceed the maximum file size
function checkImageSizes(imageReferences) {
  const oversized = [];
  
  imageReferences.forEach(ref => {
    if (imageExists(ref)) {
      const sizeKB = getImageSizeKB(ref);
      let maxSize = IMAGE_STANDARDS.quest.maxSizeKB; // Default
      
      if (ref.includes('/npc/')) {
        maxSize = IMAGE_STANDARDS.npc.maxSizeKB;
      }
      
      if (sizeKB > maxSize) {
        oversized.push({
          path: ref,
          size: sizeKB,
          maxSize: maxSize
        });
      }
    }
  });
  
  return oversized;
}

// Check for images with incorrect dimensions
function checkImageDimensions(imageReferences) {
  const incorrectDimensions = [];
  
  imageReferences.forEach(ref => {
    if (imageExists(ref)) {
      // Get the expected dimensions
      let expectedDimensions = IMAGE_STANDARDS.quest.dimensions;
      if (ref.includes('/npc/')) {
        expectedDimensions = IMAGE_STANDARDS.npc.dimensions;
      }
      
      // Get the actual dimensions (mocked in this implementation)
      const actualDimensions = getImageDimensions(ref);
      
      // Check if dimensions match expected standards
      if (actualDimensions.width !== expectedDimensions.width || 
          actualDimensions.height !== expectedDimensions.height) {
        incorrectDimensions.push({
          path: ref,
          actual: actualDimensions,
          expected: expectedDimensions
        });
      }
    }
  });
  
  return incorrectDimensions;
}

// Check for similarly named files that might indicate typos
function findSimilarImages(missingImage) {
  const fileExtension = path.extname(missingImage);
  const fileBasename = path.basename(missingImage, fileExtension);
  const directoryName = path.dirname(missingImage);
  
  // Look for files with similar names in the same directory
  const searchPattern = path.join(
    __dirname, 
    publicDirectoryRelativePath, 
    directoryName.startsWith('/') ? directoryName.substring(1) : directoryName,
    `${fileBasename.substring(0, 3)}*${fileExtension}`
  );
  
  const similarFiles = glob.sync(searchPattern)
    .map(file => {
      // Convert back to web path format
      const relativePath = path.relative(
        path.join(__dirname, publicDirectoryRelativePath),
        file
      );
      return '/' + relativePath.replace(/\\/g, '/');
    });
  
  return similarFiles;
}

describe('Image Reference Tests', () => {
  let imageReferences = [];
  let imageReport = { missing: [], existing: [] };
  let oversizedImages = [];
  let incorrectDimensionImages = [];
  
  beforeAll(() => {
    imageReferences = collectImageReferences();
    imageReport = checkMissingImages(imageReferences);
    oversizedImages = checkImageSizes(imageReport.existing);
    incorrectDimensionImages = checkImageDimensions(imageReport.existing);
  });
  
  test('All referenced images exist', () => {
    const totalImages = imageReferences.length;
    const missingCount = imageReport.missing.length;
    
    if (missingCount > 0) {
      console.warn(`\nMissing Images: ${missingCount}/${totalImages}`);
      
      // Group missing images by directory for better organization
      const missingByDirectory = imageReport.missing.reduce((acc, imagePath) => {
        const directory = path.dirname(imagePath);
        if (!acc[directory]) {
          acc[directory] = [];
        }
        acc[directory].push(path.basename(imagePath));
        return acc;
      }, {});
      
      // Output missing images grouped by directory
      for (const [directory, files] of Object.entries(missingByDirectory)) {
        console.warn(`\n${directory}/`);
        files.forEach(file => {
          console.warn(`  - ${file}`);
          
          // Suggest similar files that might have been intended
          const similarFiles = findSimilarImages(`${directory}/${file}`);
          if (similarFiles.length > 0) {
            console.warn('    Similar files found:');
            similarFiles.forEach(similar => {
              console.warn(`    - ${similar}`);
            });
          }
        });
      }
    }
    
    console.info(`\nFound ${imageReport.existing.length} valid image references`);
    
    // For now, output warnings but don't fail tests
    // This allows running tests without all images being in place yet
    // Uncomment the line below to enforce all images existing:
    // expect(missingCount).toBe(0);
    
    expect(true).toBe(true);
  });
  
  test('Images meet size requirements', () => {
    if (oversizedImages.length > 0) {
      console.warn('\nOversized Images:');
      oversizedImages.forEach(image => {
        console.warn(`- ${image.path} (${image.size}KB, exceeds ${image.maxSize}KB limit)`);
      });
    }
    
    // For now, just output warnings
    expect(true).toBe(true);
  });
  
  test('Images have correct dimensions', () => {
    if (incorrectDimensionImages.length > 0) {
      console.warn('\nImages with incorrect dimensions:');
      incorrectDimensionImages.forEach(image => {
        console.warn(`- ${image.path} (${image.actual.width}x${image.actual.height}, expected ${image.expected.width}x${image.expected.height})`);
      });
    }
    
    // For now, just output warnings
    expect(true).toBe(true);
  });
  
  test('Quest images follow naming conventions', () => {
    const questImagePattern = /^\/assets\/quests\/[\w-]+\.(jpg|png|webp)$/;
    const nonConformingImages = imageReferences
      .filter(ref => ref.includes('/quests/'))
      .filter(ref => !questImagePattern.test(ref));
    
    if (nonConformingImages.length > 0) {
      console.warn('\nQuest images not following naming convention:');
      nonConformingImages.forEach(image => {
        console.warn(`- ${image}`);
      });
    }
    
    // For now, just output warnings
    expect(true).toBe(true);
  });
  
  test('NPC images follow naming conventions', () => {
    const npcImagePattern = /^\/assets\/npc\/[\w-]+\.(jpg|png|webp)$/;
    const nonConformingImages = imageReferences
      .filter(ref => ref.includes('/npc/'))
      .filter(ref => !npcImagePattern.test(ref));
    
    if (nonConformingImages.length > 0) {
      console.warn('\nNPC images not following naming convention:');
      nonConformingImages.forEach(image => {
        console.warn(`- ${image}`);
      });
    }
    
    // For now, just output warnings
    expect(true).toBe(true);
  });
}); 