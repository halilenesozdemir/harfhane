CREATE TABLE badges (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  description TEXT    NOT NULL,
  icon        TEXT    NOT NULL
);

CREATE TABLE user_xp (
  user_id    INTEGER NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_xp   INTEGER NOT NULL DEFAULT 0,
  level      INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE user_badges (
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id  INTEGER NOT NULL REFERENCES badges(id),
  earned_at TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);

INSERT INTO badges (slug, name, description, icon) VALUES
  ('first-step',    'İlk Adım',       'İlk oyununu tamamla',                  'Star'),
  ('sharpshooter',  'Keskin Nişancı', '1. tahminde kazan',                    'Target'),
  ('on-fire',       'Ateş',           '7 günlük seri yap',                    'Flame'),
  ('word-master',   'Söz Ustası',     '50 oyun tamamla',                      'BookOpen'),
  ('perfect-run',   'Mükemmel Seri',  '10 oyunu arka arkaya kazan',           'Trophy'),
  ('lexicon',       'Lügat',          '100 oyun tamamla',                     'Library'),
  ('legend',        'Efsane',         'Level 5''e ulaş',                      'Crown');
