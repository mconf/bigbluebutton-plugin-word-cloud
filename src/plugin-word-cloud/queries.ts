export const PUBLIC_CHAT_MESSAGES_SUBSCRIPTION = `
  subscription publicChatMessages {
    chat_message_public {
      messageId
      message
      messageType
      senderId
      senderName
      createdAt
      editedAt
      deletedAt
    }
  }
`;
