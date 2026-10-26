import { flatten } from './flatten'

// English texts: the “Today” tab, week navigation, countdown, test kinds
export default flatten({
  common: { busy: 'Busy' },
  countdown: {
    past: 'past',
    today: 'today',
    tomorrow: 'tomorrow',
    inDays_one: 'in {count} day',
    inDays_other: 'in {count} days',
  },
  testKind: {
    exam: 'Exam',
    colloquium: 'Colloquium',
    quiz: 'Quiz / other',
  },
  week: {
    prev: 'Previous week',
    next: 'Next week',
    today: 'Today',
  },
  today: {
    headingToday: 'Today: {date}',
    headingDay: 'Day: {date}',
    prevDay: 'Previous day',
    nextDay: 'Next day',
    todayButton: 'Today',
    group: 'Group:',
    noGroup:
      'You do not belong to any group, so you only see your own day. Join a group in the “Groups” tab to see your friends.',
    slotsTitle: 'Shared free slots',
    slotsFromNow: '(from now)',
    allHidden: 'Everyone is hidden. Show someone in the “Shared free slots” tab.',
    slotsFor: 'For: {names}. Minimum length: {min} min (you can change it in Settings).',
    dayExcluded:
      'This day is not included in free slots (you can turn on the weekend in Settings).',
    noSlots: 'No shared free slots on this day.',
    noClasses: 'No classes on this day.',
    you: '(You)',
    me: 'Me',
    blockDay: 'Day and navigation',
    blockPeople: 'People’s classes',
  },
  free: {
    title: 'Who is free now',
    checking: 'Checking schedules…',
    weekend: 'It’s the weekend: nobody has classes on the grid.',
    count_one: '{free} of {count} person free',
    count_other: '{free} of {count} people free',
    noMoreSlots: 'There are no more shared free slots today.',
    freeFor: 'Everyone is free for another {duration} (until {until}).',
    nextSlot: 'Next shared free slot: {from}–{to} (in {duration}).',
    busyUntil: 'in class until {time}',
    freeUntil: 'free until {time}',
    freeAllDay: 'free for the rest of the day',
  },
  pushups: {
    title: 'Challenge: push-ups',
    perDay: 'push-ups a day',
    dayInfo: 'Challenge day {day} · week {week} · day {inWeek} of 7',
    next_one: 'In {count} day ({date}) it will be {next} a day.',
    next_other: 'In {count} days ({date}) it will be {next} a day.',
    startsIn_one: 'The challenge starts in {count} day ({date}).',
    startsIn_other: 'The challenge starts in {count} days ({date}).',
  },
  upcoming: { title: 'Upcoming tests' },
})
