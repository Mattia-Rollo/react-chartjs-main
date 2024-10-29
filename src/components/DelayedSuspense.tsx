import { useEffect, useState, FC, Suspense, ComponentProps } from 'react';

interface DelayedSuspenseProps extends ComponentProps<typeof Suspense> {
  minDelay?: number;
}

const MinDelayComponent: FC<{ minDelay: number, children: React.ReactNode }> = ({ 
  minDelay, 
  children 
}) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, minDelay);

    return () => clearTimeout(timer);
  }, [minDelay]);

  return shouldRender ? <>{children}</> : null;
};

export const DelayedSuspense: FC<DelayedSuspenseProps> = ({ 
  minDelay = 500,
  children, 
  fallback 
}) => {
  return (
    <Suspense fallback={
      <MinDelayComponent minDelay={minDelay}>
        {fallback}
      </MinDelayComponent>
    }>
      {children}
    </Suspense>
  );
};