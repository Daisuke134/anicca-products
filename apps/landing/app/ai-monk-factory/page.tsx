import type { Metadata } from 'next';
import Factory from './factory';
import './factory.css';

export const metadata: Metadata = {
  title: 'AI Monk Factory — Your monk. Your next Reel.',
  description: 'Create an original fictional AI monk, generate scripted videos, and connect Instagram for daily Reels. Research, creation, and publishing in one place.',
  alternates: { canonical: 'https://aniccaai.com/ai-monk-factory' },
};

export default function FactoryPage() { return <Factory />; }
