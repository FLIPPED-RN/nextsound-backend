export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  category: 'listener' | 'artist' | 'social' | 'special';
  metric: string;
  target: number;
  premium?: boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Слушатель
  { id: 'first_listen', title: 'Первый трек', desc: 'Послушай свой первый трек', emoji: '🎧', category: 'listener', metric: 'listened', target: 1 },
  { id: 'melomaniac', title: 'Меломан', desc: 'Послушай 50 треков', emoji: '🎶', category: 'listener', metric: 'listened', target: 50 },
  { id: 'explorer', title: 'Исследователь', desc: 'Послушай 200 треков', emoji: '🧭', category: 'listener', metric: 'listened', target: 200 },
  { id: 'liker', title: 'Душа лайка', desc: 'Поставь 25 лайков', emoji: '❤️', category: 'listener', metric: 'likes', target: 25 },
  // Артист
  { id: 'debut', title: 'Дебют', desc: 'Загрузи свой первый трек', emoji: '🎤', category: 'artist', metric: 'uploads', target: 1 },
  { id: 'rising', title: 'На взлёте', desc: '100 прослушиваний твоих треков', emoji: '📈', category: 'artist', metric: 'plays', target: 100 },
  { id: 'star', title: 'Звезда', desc: '1000 прослушиваний твоих треков', emoji: '⭐', category: 'artist', metric: 'plays', target: 1000 },
  { id: 'album_out', title: 'Релиз', desc: 'Выпусти альбом', emoji: '💿', category: 'artist', metric: 'albums', target: 1 },
  { id: 'first_fan', title: 'Первый фанат', desc: 'Получи первого подписчика', emoji: '🥰', category: 'artist', metric: 'followers', target: 1 },
  { id: 'famous', title: 'Популярный', desc: 'Набери 10 подписчиков', emoji: '🔥', category: 'artist', metric: 'followers', target: 10 },
  // Социальные
  { id: 'critic', title: 'Критик', desc: 'Оставь 25 комментариев', emoji: '💬', category: 'social', metric: 'comments', target: 25 },
  { id: 'curator', title: 'Куратор', desc: 'Создай плейлист', emoji: '📂', category: 'social', metric: 'playlists', target: 1 },
  { id: 'spreader', title: 'Распространитель', desc: 'Сделай 5 репостов', emoji: '🔁', category: 'social', metric: 'reposts', target: 5 },
  // Особые
  { id: 'patron', title: 'Меценат', desc: 'Оформи подписку NextSound', emoji: '👑', category: 'special', metric: 'subscriber', target: 1, premium: true },
  { id: 'collector', title: 'Коллекционер', desc: 'Собери 10 достижений', emoji: '🏆', category: 'special', metric: 'unlocked', target: 10 },
];
