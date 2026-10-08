import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import PrivacyPage from './PrivacyPage';

function getRobotsMetaContent(): string | null {
  return document.head.querySelector('meta[name="robots"]')?.getAttribute('content') ?? null;
}

describe('PrivacyPage', () => {
  afterEach(() => {
    document.head.querySelector('meta[name="robots"]')?.remove();
  });

  it('should render the draft heading and the draft-awaiting-approval notice (007-AE1)', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('heading', { name: /gizlilik politikası \(taslak\)/i })).toBeInTheDocument();
    expect(screen.getByText(/taslaktır/i)).toBeInTheDocument();
    expect(screen.getByText(/onay/i)).toBeInTheDocument();
  });

  it('should state there are no accounts, stats stay on-device and no play-level data reaches Harfhane servers (007-AE1)', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/hesap (oluşturma|sistemi) yoktur|hesap yoktur/i)).toBeInTheDocument();
    expect(screen.getAllByText(/cihazınızda/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/reklam/i).length).toBeGreaterThan(0);
  });

  // Turkish "İ"/"I" do not case-fold the way the regex /i flag assumes
  // (AGENTS.md: never rely on default casing for Turkish text), so these
  // headings are matched against their exact on-page casing instead.
  it('should render the KVKK headings (veri sorumlusu, işlenen veriler, amaç, aktarım, haklar) (007-AE1)', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('heading', { name: 'Veri Sorumlusu' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'İşlenen Veriler' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'İşleme Amacı' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Aktarım ve Yurt Dışına Aktarım' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Haklarınız (KVKK Madde 11)' })).toBeInTheDocument();
  });

  it('should set a noindex robots meta tag so search engines do not index the draft', () => {
    render(<PrivacyPage />);
    expect(getRobotsMetaContent()).toBe('noindex');
  });
});

describe('sitemap generator', () => {
  it('should not list the unapproved privacy draft route', () => {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'generate-sitemap.mjs');
    const source = readFileSync(scriptPath, 'utf-8');
    expect(source).not.toMatch(/gizlilik/i);
  });
});
