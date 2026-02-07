#!/usr/bin/osascript
--
-- AppleScript to create events in Apple Calendar
-- Usage: create-event.scpt "Title" "2026-02-10T10:00:00" "2026-02-10T11:00:00" "Location" "Description" "CalendarName"
--

on run argv
    try
        set eventTitle to item 1 of argv
        set startDateStr to item 2 of argv
        set endDateStr to item 3 of argv
        set eventLocation to item 4 of argv
        set eventDescription to item 5 of argv
        set calName to item 6 of argv
        
        -- Parse ISO dates
        set startDate to parseISO8601Date(startDateStr)
        set endDate to parseISO8601Date(endDateStr)
        
        tell application "Calendar"
            tell calendar calName
                set newEvent to make new event with properties {summary:eventTitle, start date:startDate, end date:endDate, location:eventLocation, description:eventDescription}
                return "Created: " & (uid of newEvent as string)
            end tell
        end tell
        
    on error errMsg
        return "Error: " & errMsg
    end try
end run

-- Parse ISO 8601 date string
on parseISO8601Date(dateStr)
    -- Handle both datetime and date-only formats
    if dateStr contains "T" then
        -- Format: 2026-02-10T10:00:00 or 2026-02-10T10:00:00Z
        set datePart to text 1 thru 10 of dateStr
        set timePart to text 12 thru 19 of dateStr
        
        set yearPart to text 1 thru 4 of datePart as number
        set monthPart to text 6 thru 7 of datePart as number
        set dayPart to text 9 thru 10 of datePart as number
        
        set hourPart to text 1 thru 2 of timePart as number
        set minPart to text 4 thru 5 of timePart as number
        set secPart to text 7 thru 8 of timePart as number
        
        tell (current date)
            set its year to yearPart
            set its month to monthPart
            set its day to dayPart
            set its hours to hourPart
            set its minutes to minPart
            set its seconds to secPart
            return it
        end tell
    else
        -- Format: 2026-02-10 (all-day event)
        set yearPart to text 1 thru 4 of dateStr as number
        set monthPart to text 6 thru 7 of dateStr as number
        set dayPart to text 9 thru 10 of dateStr as number
        
        tell (current date)
            set its year to yearPart
            set its month to monthPart
            set its day to dayPart
            set its hours to 0
            set its minutes to 0
            set its seconds to 0
            return it
        end tell
    end if
end parseISO8601Date
