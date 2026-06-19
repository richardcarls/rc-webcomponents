import clsx from 'clsx';
import type { ReactNode } from 'react';
import { ClientOnly } from './ClientOnly';
import styles from './DemoFrame.module.css';

export interface DemoFrameProps {
  children: ReactNode;
  label?: string;
  material?: boolean;
}

export function DemoFrame({ children, label = 'Live demo', material = false }: DemoFrameProps) {
  return (
    <ClientOnly fallback={<section className={styles.root} aria-label={label} />}>
        <section
          className={clsx(styles.root, material && 'rc-theme-material')}
          aria-label={label}
        >
          {children}
        </section>
    </ClientOnly>
  );
}
