ALTER TABLE game_results ADD COLUMN mode TEXT NOT NULL DEFAULT 'daily';
ALTER TABLE game_results ADD COLUMN word_id INTEGER REFERENCES words(id);
