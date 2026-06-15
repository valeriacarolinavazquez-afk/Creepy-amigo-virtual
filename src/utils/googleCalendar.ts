import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App dynamically to prevent double initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Workspace scope we got authorized for
provider.addScope('https://www.googleapis.com/auth/calendar');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize Auth listener. Keeps the session token in-memory
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el Token de Acceso desde Google Authentication.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error de inicio de sesión de Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Get active token
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

// Set token manually (useful for instant login handler)
export const setCachedToken = (token: string) => {
  cachedAccessToken = token;
};

// Log Out
export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
}

// Fetch calendar events from primary Google Calendar
export const fetchClippyEvents = async (accessToken: string): Promise<CalendarEvent[]> => {
  try {
    // We fetch a list of events from the primary calendar, filtered to include a range or simply search.
    // Fetching the last 150 events to keep it fast while robust enough for long streaks.
    const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events' +
      '?maxResults=150&orderBy=startTime&singleEvents=true' +
      `&q=${encodeURIComponent('Día de Juego Clippy')}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Error al listar eventos: ${res.statusText}`);
    }

    const data = await res.json();
    const events: CalendarEvent[] = data.items || [];
    
    // Sort events by date descending so latest registered days appear first
    return events.sort((a, b) => {
      const dateA = a.start.date || a.start.dateTime || '';
      const dateB = b.start.date || b.start.dateTime || '';
      return dateB.localeCompare(dateA);
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
};

// Add Today's Play Day as an All-Day event
export const createClippyPlayDay = async (accessToken: string, dateStr: string): Promise<CalendarEvent> => {
  try {
    const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    
    // Create correct start date YYYY-MM-DD
    const start = { date: dateStr };
    
    // Correct end date for an all day event is the subsequent day
    const nextDay = new Date(dateStr);
    nextDay.getUTCDate(); // fix offset issues
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const endStr = nextDay.toISOString().split('T')[0];
    const end = { date: endStr };

    const body = {
      summary: `Día de Juego Clippy 🎮`,
      description: '¡Día registrado en Google Calendar como testimonio de tu juego y cuidado en la Mascota Virtual Clippy! ¡Seguí adelante cuidando a tu asistente retro favoriti! ✨ Paperclip helper companion stats safe.',
      start,
      end,
      reminders: { useDefault: false }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Error al crear evento de calendario: ${errText}`);
    }

    return await res.json();
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

// Delete a tracked event
export const deleteClippyPlayDay = async (accessToken: string, eventId: string): Promise<boolean> => {
  try {
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Error al eliminar evento de juego: ${res.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
};
