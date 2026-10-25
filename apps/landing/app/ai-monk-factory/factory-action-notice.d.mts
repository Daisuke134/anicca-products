import type { ReactNode } from 'react';

export function FactoryActionNotice(props: {
  notice: { action: string; message: string } | null;
  action: string;
}): ReactNode;
