INSERT OR IGNORE INTO posts(
  id, author_name, profile_id, day_index, visibility, text, place_name,
  media_key, media_type, media_name, media_size, created_at
) VALUES(
  'weroad-predeparture', 'India insieme', '', -1, 'public',
  'Il gruppo si sta formando: preparativi in corso, valigie quasi pronte e l’India sempre più vicina. Si parte insieme con WEROAD!',
  '', NULL, NULL, NULL, 0, '2026-08-04 13:30:16'
);

INSERT OR IGNORE INTO post_media(
  id, post_id, media_key, media_type, media_name, media_size, position, created_at
) VALUES(
  'weroad-predeparture-photo', 'weroad-predeparture', 'static:/ui/weroad-logo.png',
  'image/png', 'WEROAD · Preparativi per l’India', 55812, 0, '2026-08-04 13:30:16'
);
