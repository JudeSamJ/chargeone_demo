import { useEffect, useState } from 'react';

const useRazorpay = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
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
      // Clean up the script when the component unmounts
      const scripts = document.querySelectorAll('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      scripts.forEach(s => document.body.removeChild(s));
    };
  }, []);

  return [isLoaded, isLoaded ? (window as any).Razorpay : null];
};

export { useRazorpay };
