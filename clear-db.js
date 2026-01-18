// Quick script to clear the SQLite database for testing
const fs = require('fs');
const path = require('path');

// Path where Expo stores the database on your Mac
const dbPath = path.join(process.env.HOME, 'Library/Developer/CoreSimulator/Devices/*/data/Containers/Data/Application/*/Documents/SQLite/drift.db');

console.log('This script is for iOS Simulator only.');
console.log('To clear the database:');
console.log('1. Close the app completely');
console.log('2. Delete the app from simulator');
console.log('3. Reinstall and run again');
console.log('');
console.log('Or use this command in terminal:');
console.log('xcrun simctl erase all');
