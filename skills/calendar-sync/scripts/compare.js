#!/usr/bin/env node
/**
 * Calendar Event Comparator
 * Compares events between Apple and Google calendars
 * Outputs events that need to be synced
 */

const fs = require('fs');
const crypto = require('crypto');

// Load state and events
function loadJSON(path) {
    try {
        return JSON.parse(fs.readFileSync(path, 'utf8'));
    } catch (e) {
        return {};
    }
}

// Generate hash for event matching
function hashEvent(title, start) {
    return crypto.createHash('sha256')
        .update(`${title}:${start}`)
        .digest('hex')
        .substring(0, 16);
}

// Normalize date/time for comparison
function normalizeDate(dateStr) {
    if (!dateStr) return '';
    // Remove milliseconds and timezone for comparison
    return dateStr.replace(/\.\d{3}/, '').replace(/Z$/, '').replace(/[+\-]\d{2}:\d{2}$/, '');
}

// Compare two events for equality (within tolerance)
function eventsMatch(event1, event2) {
    const titleMatch = (event1.title || '').toLowerCase().trim() === (event2.title || '').toLowerCase().trim();
    const startMatch = normalizeDate(event1.start) === normalizeDate(event2.start);
    
    return titleMatch && startMatch;
}

// Check if event exists in array
function eventExists(event, eventArray) {
    return eventArray.some(e => eventsMatch(event, e));
}

// Find events to create in target calendar
function findEventsToCreate(source, target, sourceName, targetName, uidMap) {
    return source.filter(event => {
        // Skip if already exists in target
        if (eventExists(event, target)) {
            return false;
        }
        
        // Skip if UID mapping exists
        if (event.uid && uidMap && uidMap[event.uid]) {
            return false;
        }
        
        return true;
    }).map(event => ({
        ...event,
        action: `create_in_${targetName}`,
        source_uid: event.uid,
        source_calendar: sourceName
    }));
}

// Main comparison logic
function compareCalendars(appleEvents, googleEvents, state) {
    const uidMap = state.uid_map || {};
    
    // Filter out cancelled/null events
    const apple = (appleEvents || []).filter(e => e && e.title);
    const google = (googleEvents || []).filter(e => e && e.title);
    
    console.error(`Comparing ${apple.length} Apple events vs ${google.length} Google events`);
    
    // Find events to create in Google (exist in Apple, not in Google)
    const toGoogle = findEventsToCreate(apple, google, 'apple', 'google', uidMap);
    
    // Find events to create in Apple (exist in Google, not in Apple)
    const toApple = findEventsToCreate(google, apple, 'google', 'apple', uidMap);
    
    return {
        toGoogle,
        toApple,
        stats: {
            appleEvents: apple.length,
            googleEvents: google.length,
            toCreateInGoogle: toGoogle.length,
            toCreateInApple: toApple.length
        }
    };
}

// CLI
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
        console.error('Usage: compare.js <apple_events.json> <google_events.json> <state.json>');
        process.exit(1);
    }
    
    const [appleFile, googleFile, stateFile] = args;
    
    const appleEvents = loadJSON(appleFile);
    const googleEvents = loadJSON(googleFile);
    const state = loadJSON(stateFile);
    
    const result = compareCalendars(appleEvents, googleEvents, state);
    
    // Output results as JSON
    console.log(JSON.stringify(result, null, 2));
}

module.exports = { compareCalendars, eventsMatch, hashEvent };
