declare global {
  interface Window {
    Tawk_API?: {
      toggle?: () => void;
      maximize?: () => void;
      minimize?: () => void;
      showWidget?: () => void;
      hideWidget?: () => void;
      popup?: () => void;
      setAttributes?: (attributes: Record<string, any>, callback?: (error?: any) => void) => void;
      onLoad?: () => void;
      onChatStarted?: () => void;
    };
  }
}

/**
 * Opens or maximizes the Tawk.to live chat window
 */
export const openTawkSupportChat = (userData?: { name?: string; email?: string; address?: string }) => {
  if (typeof window === 'undefined') return;

  if (window.Tawk_API) {
    if (userData && window.Tawk_API.setAttributes) {
      window.Tawk_API.setAttributes(
        {
          name: userData.name || 'Usuario Trust Wallet',
          email: userData.email || '',
          walletAddress: userData.address || '',
        },
        () => {}
      );
    }

    if (typeof window.Tawk_API.maximize === 'function') {
      window.Tawk_API.maximize();
      return;
    }

    if (typeof window.Tawk_API.toggle === 'function') {
      window.Tawk_API.toggle();
      return;
    }
  } else {
    // If not loaded yet or in a standalone frame, provide fallback to direct link
    window.open('https://tawk.to/chat/6a8849ddd79015343cfb4483/1k0i612ou', '_blank');
  }
};
