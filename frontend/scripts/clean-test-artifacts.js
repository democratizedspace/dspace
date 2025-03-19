#!/usr/bin/env node

/**
 * This script cleans up test artifact files from the project root directory
 * and moves them to their dedicated directories if needed.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configure file patterns for different artifact types
const TEST_ARTIFACT_PATTERNS = {
    screenshots: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    videos: ['.mp4', '.webm', '.avi', '.mov'],
};

// Target directories for artifacts
const TARGET_DIRS = {
    screenshots: path.join(__dirname, '..', 'test-screenshots'),
    videos: path.join(__dirname, '..', 'test-videos'),
};

// Ensure target directories exist
Object.values(TARGET_DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Root directory to search
const rootDir = path.join(__dirname, '..');

// Find files in the root directory that match artifact patterns
fs.readdir(rootDir, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        process.exit(1);
    }

    let artifactsFound = false;

    // Process each file
    files.forEach(file => {
        const filePath = path.join(rootDir, file);
        
        // Skip if it's a directory or non-regular file
        if (!fs.statSync(filePath).isFile()) {
            return;
        }
        
        // Check file extension against patterns
        const ext = path.extname(file).toLowerCase();
        
        if (TEST_ARTIFACT_PATTERNS.screenshots.includes(ext)) {
            moveOrDelete(filePath, TARGET_DIRS.screenshots, file);
            artifactsFound = true;
        } else if (TEST_ARTIFACT_PATTERNS.videos.includes(ext)) {
            moveOrDelete(filePath, TARGET_DIRS.videos, file);
            artifactsFound = true;
        }
    });

    if (!artifactsFound) {
        console.log('No test artifacts found in root directory.');
    }
});

/**
 * Move a file to a target directory or delete it
 * @param {string} sourcePath - Path to the source file
 * @param {string} targetDir - Target directory
 * @param {string} fileName - Name of the file
 */
function moveOrDelete(sourcePath, targetDir, fileName) {
    const targetPath = path.join(targetDir, fileName);
    
    try {
        // Try to move the file
        fs.renameSync(sourcePath, targetPath);
        console.log(`Moved: ${sourcePath} -> ${targetPath}`);
    } catch (err) {
        // If moving fails, try to delete it
        try {
            fs.unlinkSync(sourcePath);
            console.log(`Deleted: ${sourcePath}`);
        } catch (deleteErr) {
            console.error(`Failed to process ${sourcePath}: ${deleteErr.message}`);
        }
    }
} 