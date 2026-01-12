import { defineMessages } from 'react-intl';

export const intlMessages = defineMessages({
  title: {
    id: 'app.wordCloud.title',
    description: 'Title for the word cloud',
  },
  startTyping: {
    id: 'app.wordCloud.startTyping',
    description: 'Placeholder text where there is no chat messages yet',
  },
  description: {
    id: 'app.wordCloud.description',
    description: 'Description of the word cloud feature',
  },
  descriptionAttendee: {
    id: 'app.wordCloud.description.attendee',
    description: 'Description for attendees',
  },
  startButton: {
    id: 'app.wordCloud.startButton',
    description: 'Button to start word cloud',
  },
  stopButton: {
    id: 'app.wordCloud.stopButton',
    description: 'Button to stop word cloud',
  },
  startFromNow: {
    id: 'app.wordCloud.startFromNow',
    description: 'Option to count words only from activation moment',
  },
});
