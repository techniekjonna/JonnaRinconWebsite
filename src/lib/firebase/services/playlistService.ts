import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
  QueryConstraint,
  onSnapshot,
  Unsubscribe,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../config';
import { Playlist } from '../types';
import { authService } from './authService';
import { cleanFirestoreData } from '../utils/cleanFirestoreData';

class PlaylistService {
  private collectionName = 'playlists';

  /**
   * Get all playlists for a specific user
   */
  async getPlaylistsByUserId(userId: string): Promise<Playlist[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const playlists: Playlist[] = [];

      querySnapshot.forEach((doc) => {
        playlists.push({ id: doc.id, ...doc.data() } as Playlist);
      });

      return playlists;
    } catch (error) {
      console.error('Get playlists by user ID error:', error);
      return [];
    }
  }

  /**
   * Create a new playlist
   */
  async createPlaylist(
    name: string,
    userId: string,
    trackIds?: string[],
    description?: string,
    coverImage?: string
  ): Promise<Playlist> {
    const user = authService.getCurrentUser();

    if (!user) {
      throw new Error('Unauthorized: User must be logged in');
    }

    if (user.uid !== userId && user.role !== 'admin') {
      throw new Error('Unauthorized: Can only create playlists for yourself');
    }

    try {
      const newPlaylist = cleanFirestoreData({
        userId,
        name,
        description,
        trackIds: trackIds || [],
        coverImage: coverImage || '',
        isPublic: false,
        isFeatured: false,
        views: 0,
        likes: 0,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const docRef = await addDoc(collection(db, this.collectionName), newPlaylist);

      const createdPlaylist = await this.getPlaylistById(docRef.id);

      if (!createdPlaylist) {
        throw new Error('Failed to retrieve created playlist');
      }

      return createdPlaylist;
    } catch (error: any) {
      console.error('Create playlist error:', error);
      throw new Error(error.message || 'Failed to create playlist');
    }
  }

  /**
   * Get a playlist by ID
   */
  async getPlaylistById(id: string): Promise<Playlist | null> {
    try {
      const playlistDoc = await getDoc(doc(db, this.collectionName, id));

      if (playlistDoc.exists()) {
        return { id: playlistDoc.id, ...playlistDoc.data() } as Playlist;
      }

      return null;
    } catch (error) {
      console.error('Get playlist by ID error:', error);
      return null;
    }
  }

  /**
   * Update playlist with security checks
   * Only owner or admin can update
   */
  async updatePlaylist(id: string, updates: Partial<Playlist>): Promise<void> {
    const user = authService.getCurrentUser();

    if (!user) {
      throw new Error('Unauthorized: User must be logged in');
    }

    try {
      // Fetch the playlist to check ownership
      const playlist = await this.getPlaylistById(id);

      if (!playlist) {
        throw new Error('Playlist not found');
      }

      // Check authorization: owner or admin
      if (playlist.userId !== user.uid && user.role !== 'admin') {
        throw new Error('Unauthorized: Only owner or admin can update playlist');
      }

      // Admin-only fields: isFeatured
      if (updates.isFeatured !== undefined && user.role !== 'admin') {
        throw new Error('Unauthorized: Only admin can feature playlists');
      }

      const cleanedUpdates = cleanFirestoreData({
        ...updates,
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, this.collectionName, id), cleanedUpdates);
    } catch (error: any) {
      console.error('Update playlist error:', error);
      throw new Error(error.message || 'Failed to update playlist');
    }
  }

  /**
   * Delete playlist with security checks
   * Only owner or admin can delete
   */
  async deletePlaylist(id: string): Promise<void> {
    const user = authService.getCurrentUser();

    if (!user) {
      throw new Error('Unauthorized: User must be logged in');
    }

    try {
      // Fetch the playlist to check ownership
      const playlist = await this.getPlaylistById(id);

      if (!playlist) {
        throw new Error('Playlist not found');
      }

      // Check authorization: owner or admin
      if (playlist.userId !== user.uid && user.role !== 'admin') {
        throw new Error('Unauthorized: Only owner or admin can delete playlist');
      }

      await deleteDoc(doc(db, this.collectionName, id));
    } catch (error: any) {
      console.error('Delete playlist error:', error);
      throw new Error(error.message || 'Failed to delete playlist');
    }
  }

  /**
   * Add a track to playlist
   */
  async addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
    const user = authService.getCurrentUser();

    if (!user) {
      throw new Error('Unauthorized: User must be logged in');
    }

    try {
      // Fetch the playlist to check ownership
      const playlist = await this.getPlaylistById(playlistId);

      if (!playlist) {
        throw new Error('Playlist not found');
      }

      // Check authorization: owner or admin
      if (playlist.userId !== user.uid && user.role !== 'admin') {
        throw new Error('Unauthorized: Only owner or admin can add tracks to playlist');
      }

      // Avoid adding duplicate track IDs
      if (!playlist.trackIds.includes(trackId)) {
        await updateDoc(doc(db, this.collectionName, playlistId), {
          trackIds: arrayUnion(trackId),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error: any) {
      console.error('Add track to playlist error:', error);
      throw new Error(error.message || 'Failed to add track to playlist');
    }
  }

  /**
   * Remove a track from playlist
   */
  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    const user = authService.getCurrentUser();

    if (!user) {
      throw new Error('Unauthorized: User must be logged in');
    }

    try {
      // Fetch the playlist to check ownership
      const playlist = await this.getPlaylistById(playlistId);

      if (!playlist) {
        throw new Error('Playlist not found');
      }

      // Check authorization: owner or admin
      if (playlist.userId !== user.uid && user.role !== 'admin') {
        throw new Error('Unauthorized: Only owner or admin can remove tracks from playlist');
      }

      await updateDoc(doc(db, this.collectionName, playlistId), {
        trackIds: arrayRemove(trackId),
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Remove track from playlist error:', error);
      throw new Error(error.message || 'Failed to remove track from playlist');
    }
  }

  /**
   * Subscribe to a single playlist with real-time updates
   */
  subscribeToPlaylist(
    playlistId: string,
    callback: (playlist: Playlist | null) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    return onSnapshot(
      doc(db, this.collectionName, playlistId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          callback({ id: docSnapshot.id, ...docSnapshot.data() } as Playlist);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Subscribe to playlist error:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    );
  }

  /**
   * Subscribe to user's playlists with real-time updates
   */
  subscribeToUserPlaylists(
    userId: string,
    callback: (playlists: Playlist[]) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ];

    const q = query(collection(db, this.collectionName), ...constraints);

    return onSnapshot(
      q,
      (querySnapshot) => {
        const playlists: Playlist[] = [];

        querySnapshot.forEach((doc) => {
          playlists.push({ id: doc.id, ...doc.data() } as Playlist);
        });

        callback(playlists);
      },
      (error) => {
        console.error('Subscribe to user playlists error:', error);
        if (onError) {
          onError(error as Error);
        }
      }
    );
  }

  /**
   * Reorder tracks in a playlist
   * Only owner or admin can reorder
   */
  async reorderPlaylistTracks(playlistId: string, trackIds: string[]): Promise<void> {
    const user = authService.getCurrentUser();

    if (!user) {
      throw new Error('Unauthorized: User must be logged in');
    }

    try {
      // Fetch the playlist to check ownership
      const playlist = await this.getPlaylistById(playlistId);

      if (!playlist) {
        throw new Error('Playlist not found');
      }

      // Check authorization: owner or admin
      if (playlist.userId !== user.uid && user.role !== 'admin') {
        throw new Error('Unauthorized: Only owner or admin can reorder tracks');
      }

      await updateDoc(doc(db, this.collectionName, playlistId), {
        trackIds: trackIds,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Reorder playlist tracks error:', error);
      throw new Error(error.message || 'Failed to reorder playlist tracks');
    }
  }

  /**
   * Make playlist public
   * Only owner or admin can make public
   */
  async makePlaylistPublic(id: string): Promise<void> {
    const user = authService.getCurrentUser();

    if (!user) {
      throw new Error('Unauthorized: User must be logged in');
    }

    try {
      const playlist = await this.getPlaylistById(id);

      if (!playlist) {
        throw new Error('Playlist not found');
      }

      if (playlist.userId !== user.uid && user.role !== 'admin') {
        throw new Error('Unauthorized: Only owner or admin can change visibility');
      }

      await updateDoc(doc(db, this.collectionName, id), {
        isPublic: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Make playlist public error:', error);
      throw new Error(error.message || 'Failed to make playlist public');
    }
  }

  /**
   * Make playlist private
   * Only owner or admin can make private
   */
  async makePlaylistPrivate(id: string): Promise<void> {
    const user = authService.getCurrentUser();

    if (!user) {
      throw new Error('Unauthorized: User must be logged in');
    }

    try {
      const playlist = await this.getPlaylistById(id);

      if (!playlist) {
        throw new Error('Playlist not found');
      }

      if (playlist.userId !== user.uid && user.role !== 'admin') {
        throw new Error('Unauthorized: Only owner or admin can change visibility');
      }

      await updateDoc(doc(db, this.collectionName, id), {
        isPublic: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Make playlist private error:', error);
      throw new Error(error.message || 'Failed to make playlist private');
    }
  }

  /**
   * Feature a playlist (admin only)
   */
  async featurePlaylist(id: string): Promise<void> {
    const user = authService.getCurrentUser();

    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admin can feature playlists');
    }

    try {
      const playlist = await this.getPlaylistById(id);

      if (!playlist) {
        throw new Error('Playlist not found');
      }

      await updateDoc(doc(db, this.collectionName, id), {
        isFeatured: true,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Feature playlist error:', error);
      throw new Error(error.message || 'Failed to feature playlist');
    }
  }

  /**
   * Unfeature a playlist (admin only)
   */
  async unfeaturePlaylist(id: string): Promise<void> {
    const user = authService.getCurrentUser();

    if (!user || user.role !== 'admin') {
      throw new Error('Unauthorized: Only admin can unfeature playlists');
    }

    try {
      const playlist = await this.getPlaylistById(id);

      if (!playlist) {
        throw new Error('Playlist not found');
      }

      await updateDoc(doc(db, this.collectionName, id), {
        isFeatured: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Unfeature playlist error:', error);
      throw new Error(error.message || 'Failed to unfeature playlist');
    }
  }

  /**
   * Increment view count
   */
  async incrementViews(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, id), {
        views: increment(1),
      });
    } catch (error) {
      console.error('Increment views error:', error);
    }
  }

  /**
   * Increment like count
   */
  async incrementLikes(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, id), {
        likes: increment(1),
      });
    } catch (error) {
      console.error('Increment likes error:', error);
    }
  }

  /**
   * Get featured playlists
   */
  async getFeaturedPlaylists(): Promise<Playlist[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('isFeatured', '==', true),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const playlists: Playlist[] = [];
      querySnapshot.forEach((doc) => {
        playlists.push({ id: doc.id, ...doc.data() } as Playlist);
      });

      return playlists;
    } catch (error) {
      console.error('Get featured playlists error:', error);
      return [];
    }
  }

  /**
   * Get public playlists
   */
  async getPublicPlaylists(): Promise<Playlist[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const playlists: Playlist[] = [];
      querySnapshot.forEach((doc) => {
        playlists.push({ id: doc.id, ...doc.data() } as Playlist);
      });

      return playlists;
    } catch (error) {
      console.error('Get public playlists error:', error);
      return [];
    }
  }

  /**
   * Subscribe to admin playlists (all playlists for admin view)
   */
  subscribeToAdminPlaylists(
    callback: (playlists: Playlist[]) => void,
    filters?: { isPublic?: boolean },
    onError?: (error: Error) => void
  ): Unsubscribe {
    try {
      const constraints: QueryConstraint[] = [
        orderBy('createdAt', 'desc'),
      ];

      if (filters?.isPublic !== undefined) {
        constraints.push(where('isPublic', '==', filters.isPublic));
      }

      const q = query(collection(db, this.collectionName), ...constraints);

      return onSnapshot(
        q,
        (querySnapshot) => {
          const playlists: Playlist[] = [];

          querySnapshot.forEach((doc) => {
            playlists.push({ id: doc.id, ...doc.data() } as Playlist);
          });

          callback(playlists);
        },
        (error) => {
          console.error('Subscribe to admin playlists error:', error);
          if (onError) {
            onError(error as Error);
          }
        }
      );
    } catch (error) {
      console.error('Setup subscription error:', error);
      return () => {};
    }
  }

  /**
   * Set featured status (admin only) - convenience method
   */
  async setFeatured(id: string, featured: boolean): Promise<void> {
    if (featured) {
      await this.featurePlaylist(id);
    } else {
      await this.unfeaturePlaylist(id);
    }
  }

  /**
   * Create playlist with object parameter (for form compatibility)
   */
  async createPlaylistFromForm(playlistData: {
    userId?: string;
    name: string;
    description?: string;
    trackIds: string[];
    coverImage?: string;
    isPublic?: boolean;
    isFeatured?: boolean;
  }): Promise<Playlist> {
    const user = authService.getCurrentUser();

    if (!user) {
      throw new Error('Unauthorized: User must be logged in');
    }

    const userId = playlistData.userId || user.uid;

    if (user.uid !== userId && user.role !== 'admin') {
      throw new Error('Unauthorized: Can only create playlists for yourself');
    }

    return this.createPlaylist(
      playlistData.name,
      userId,
      playlistData.trackIds,
      playlistData.description,
      playlistData.coverImage
    );
  }
}

export const playlistService = new PlaylistService();
