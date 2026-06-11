export const AI_SERVICE = {
  NAME: 'AI_SERVICE',
  ACTIONS: {
    // Conversations
    CONVERSATION_CREATE: 'ai.conversation.create',
    CONVERSATION_FIND_ALL: 'ai.conversation.find_all', // by userId
    CONVERSATION_FIND_ONE: 'ai.conversation.find_one',
    CONVERSATION_DELETE: 'ai.conversation.delete',

    // Messages
    MESSAGE_SEND: 'ai.message.send', // send + get AI reply
    MESSAGE_FIND_ALL: 'ai.message.find_all', // by conversationId

    // Usage
    USAGE_FIND_BY_USER: 'ai.usage.find_by_user',
    USAGE_CHECK_CREDITS: 'ai.usage.check_credits', // has user enough credits?
  },
};
