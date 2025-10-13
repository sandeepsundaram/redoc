import { memo, useEffect, useState } from 'react';
import * as React from 'react';

const RedoclyLogoComponent = (): JSX.Element | null => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    setShouldRender(true);
  }, []);

  if (!shouldRender) {
    return null;
  }

  return (
    <img
      alt="dataequity logo"
      onError={() => setShouldRender(false)}
      src="https://dataequity.io/favicon.ico"
    />
  );
};

export default memo(RedoclyLogoComponent);
