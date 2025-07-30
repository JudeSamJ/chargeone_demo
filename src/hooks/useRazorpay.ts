import { useEffect, useState } from 'react';

const useRazorpay = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        setIsLoaded(true);
        return;
    }
      
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      setIsLoaded(true);
    };
    script.onerror = () => {
      console.error('Razorpay script failed to load.');
      setIsLoaded(false);
    };

    document.body.appendChild(script);

    return () => {
      const scripts = document.querySelectorAll('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (scripts.length > 1) { // Only remove if we added it multiple times by mistake
        document.body.removeChild(script);
      }
    };
  }, []);

  return [isLoaded ? (window as any).Razorpay : null, isLoaded];
};

export { useRazorpay };
