import { getDb, auth, storage } from "../firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc, 
  deleteDoc,
  onSnapshot,
  setDoc,
  or,
  and,
  deleteField
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface Team {
  id?: string;
  name: string;
  workload: number;
  schedule: {
    seg: string;
    ter: string;
    qua: string;
    qui: string;
    sex: string;
    sab: string;
    dom: string;
  };
  leaderId?: string;
  description?: string;
  color?: string;
  department?: string;
  active: boolean;
  order?: number;
  createdAt: number;
  ownerId?: string;
  sharedWith?: string[];
}

export interface DeviceToken {
  token: string;
  deviceName: string;
  lastActive: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'collaborator';
  isadmin: boolean;
  teamId?: string;
  initialPassword?: string;
  forcePasswordChange?: boolean;
  admissionDate?: string;
  company?: string;
  contract?: string;
  fcmToken?: string;
  fcmTokens?: (string | DeviceToken)[];
  notificationPermission?: 'granted' | 'denied' | 'default';
  shifts?: {
    [date: string]: {
      type: string;
      startTime: string;
      endTime: string;
      published?: boolean;
      color?: string;
    };
  };
  defaultLunchTime?: string | null;
  whatsapp?: string;
  termsAccepted?: boolean;
  termsAcceptedAt?: string;
  createdAt: number;
  ownerId?: string;
  sharedWith?: string[];
}

export interface ShareRequest {
  id?: string;
  fromAdminId: string;
  fromAdminEmail: string;
  toAdminEmail: string;
  teamId: string;
  teamName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface Alert {
  id?: string;
  title: string;
  message: string;
  createdAt: number;
  createdBy: string;
  targetAudience: 'all' | 'team' | 'user';
  targetId?: string; // teamId or userId depending on targetAudience
  readBy: string[];
  hiddenBy?: string[];
  ownerId?: string;
  sharedWith?: string[];
  scheduledFor?: number;
  priority?: 'Normal' | 'Urgente' | 'Informativo';
  // Bot Integration Fields (For WhatsApp/Push automation)
  recipientWhatsApp?: string; // Number or 'GROUP' for broadcast
  recipientTokens?: string[]; // Unique FCM tokens for this specific recipient
  isBotProcessed?: boolean; // Managed by the external WhatsApp bot to track outgoing alerts
}

const COLLECTION_NAME = "scale";
const SHARE_COLLECTION = "share_requests";
const ALERTS_COLLECTION = "alerts";
const POSTOS_COLLECTION = "postos";

export const scaleService = {
  // Postos Methods
  async getPostos() {
    try {
      const q = query(collection(getDb(), POSTOS_COLLECTION));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error getting postos: ", error);
      throw error;
    }
  },

  async updatePosto(id: string, data: any) {
    try {
      const docRef = doc(getDb(), POSTOS_COLLECTION, id);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error("Error updating posto: ", error);
      throw error;
    }
  },

  subscribeToPostos(callback: (postos: any[]) => void) {
    const q = query(collection(getDb(), POSTOS_COLLECTION));
    return onSnapshot(q, (querySnapshot) => {
      const postos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(postos);
    });
  },

  // Team Methods
  async createTeam(team: Omit<Team, 'id' | 'createdAt'>) {
    try {
      const currentUser = auth.currentUser;
      const docRef = await addDoc(collection(getDb(), COLLECTION_NAME), {
        ...team,
        type: 'team',
        createdAt: Date.now(),
        ownerId: currentUser?.uid || '',
        sharedWith: []
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding team: ", error);
      throw error;
    }
  },

  async getTeams() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];
      const uid = currentUser.uid;

      // Get user profile to check if they belong to any team
      const userProfile = await this.getUserProfile(uid);

      const orConditions = [
        where("ownerId", "==", uid),
        where("sharedWith", "array-contains", uid)
      ];

      // If user is admin and belongs to a team, they should see it
      if (userProfile?.isadmin && userProfile.teamId) {
        // We can't easily add a doc ID check in a complex 'or' with other filters in Firestore without specific indexing
        // but we can add the teamId to the list of conditions if it's not already covered
      }

      const q = query(
        collection(getDb(), COLLECTION_NAME), 
        and(
          where("type", "==", "team"),
          or(...orConditions)
        )
      );
      const querySnapshot = await getDocs(q);
      const teams = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Team[];

      // Supplemental check: if user is admin and has teamId, ensure that team is included even if not owner or sharedWith
      if (userProfile?.isadmin && userProfile.teamId && !teams.some(t => t.id === userProfile.teamId)) {
        const teamDoc = await this.getTeamById(userProfile.teamId);
        if (teamDoc) teams.push(teamDoc);
      }

      return teams;
    } catch (error) {
      console.error("Error getting teams: ", error);
      throw error;
    }
  },

  async getTeamById(id: string) {
    try {
      const docSnap = await getDocs(query(collection(getDb(), COLLECTION_NAME), where("type", "==", "team")));
      const teamDoc = docSnap.docs.find(d => d.id === id);
      if (teamDoc) {
        return { id: teamDoc.id, ...teamDoc.data() } as Team;
      }
      return null;
    } catch (error) {
      console.error("Error getting team by id: ", error);
      throw error;
    }
  },

  async updateTeam(id: string, data: Partial<Team>) {
    try {
      const docRef = doc(getDb(), COLLECTION_NAME, id);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error("Error updating team: ", error);
      throw error;
    }
  },

  async deleteTeam(id: string) {
    try {
      await deleteDoc(doc(getDb(), COLLECTION_NAME, id));
    } catch (error) {
      console.error("Error deleting team: ", error);
      throw error;
    }
  },

  subscribeToTeams(callback: (teams: Team[]) => void) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      callback([]);
      return () => {};
    }
    const uid = currentUser.uid;

    // First get the user profile to see if they belong to a team
    let userTeamId: string | undefined;
    const unsubProfile = this.subscribeToUserProfile(uid, (profile) => {
      userTeamId = profile?.isadmin ? profile.teamId : undefined;
      
      const q = query(
        collection(getDb(), COLLECTION_NAME), 
        and(
          where("type", "==", "team"),
          or(
            where("ownerId", "==", uid),
            where("sharedWith", "array-contains", uid)
          )
        )
      );

      return onSnapshot(q, async (querySnapshot) => {
        let teams = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Team[];
        
        // If the user is admin of a team they belong to, make sure it's in the list
        if (userTeamId && !teams.some(t => t.id === userTeamId)) {
          const teamDoc = await this.getTeamById(userTeamId);
          if (teamDoc) teams.push(teamDoc);
        }

        const getTeamRank = (name: string) => {
          const upper = name.toUpperCase();
          if (upper.includes('MELI')) return 1;
          if (upper.includes('FULLTIME') || upper.includes('FULL TIME')) return 2;
          if (upper.includes('PARTIME') || upper.includes('PART TIME')) return 3;
          return 4;
        };

        callback(teams.sort((a, b) => {
          const orderA = a.order !== undefined ? a.order : getTeamRank(a.name);
          const orderB = b.order !== undefined ? b.order : getTeamRank(b.name);
          return orderA - orderB;
        }));
      });
    });

    return unsubProfile;
  },

  // User Methods
  async createUserProfile(profile: UserProfile) {
    try {
      const currentUser = auth.currentUser;
      let sharedWith: string[] = [];

      if (profile.teamId) {
        const teamQuery = query(collection(getDb(), COLLECTION_NAME), where("type", "==", "team"));
        const teamSnapshot = await getDocs(teamQuery);
        const teamDoc = teamSnapshot.docs.find(d => d.id === profile.teamId);
        if (teamDoc) {
          const teamData = teamDoc.data() as Team;
          const newSharedWith = new Set(teamData.sharedWith || []);
          if (teamData.ownerId) {
            newSharedWith.add(teamData.ownerId);
          }
          sharedWith = Array.from(newSharedWith);
        }
      }

      await setDoc(doc(getDb(), COLLECTION_NAME, `user_${profile.uid}`), {
        ...profile,
        type: 'user',
        ownerId: currentUser?.uid || '',
        sharedWith
      });
    } catch (error) {
      console.error("Error creating user profile: ", error);
      throw error;
    }
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>) {
    try {
      const docRef = doc(getDb(), COLLECTION_NAME, `user_${uid}`);
      
      let updateData: any = { ...data };
      
      // Only delete the field if EXPLICITLY set to null
      if (data.defaultLunchTime === null) {
        updateData.defaultLunchTime = deleteField();
      } else if (data.defaultLunchTime === undefined) {
        // If not in partial, don't touch it
        delete updateData.defaultLunchTime;
      }

      // If user is being promoted to admin or team changes
      if (data.role === 'admin' || data.isadmin === true || data.teamId !== undefined) {
        const currentProfile = await this.getUserProfile(uid);
        const teamId = data.teamId !== undefined ? data.teamId : currentProfile?.teamId;
        const isNowAdmin = data.role === 'admin' || data.isadmin === true || currentProfile?.isadmin;

        if (teamId && isNowAdmin) {
          // Add user to team's sharedWith to ensure visibility and management rights
          const teamDoc = await this.getTeamById(teamId);
          if (teamDoc) {
            const sharedWith = new Set(teamDoc.sharedWith || []);
            if (!sharedWith.has(uid)) {
              sharedWith.add(uid);
              await this.updateTeam(teamId, { sharedWith: Array.from(sharedWith) });
            }
          }
        }
      }

      if (data.teamId !== undefined) {
        if (data.teamId === '') {
          updateData.sharedWith = [];
        } else {
          const teamQuery = query(collection(getDb(), COLLECTION_NAME), where("type", "==", "team"));
          const teamSnapshot = await getDocs(teamQuery);
          const teamDoc = teamSnapshot.docs.find(d => d.id === data.teamId);
          if (teamDoc) {
            const teamData = teamDoc.data() as Team;
            const newSharedWith = new Set(teamData.sharedWith || []);
            if (teamData.ownerId) {
              newSharedWith.add(teamData.ownerId);
            }
            updateData.sharedWith = Array.from(newSharedWith);
          }
        }
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error("Error updating user profile: ", error);
      throw error;
    }
  },

  async deleteUser(uid: string) {
    try {
      await deleteDoc(doc(getDb(), COLLECTION_NAME, `user_${uid}`));
    } catch (error) {
      console.error("Error deleting user: ", error);
      throw error;
    }
  },

  async getUserProfile(uid: string) {
    try {
      const users = await this.getUsers();
      return users.find(u => u.uid === uid) || null;
    } catch (error) {
      console.error("Error getting user profile: ", error);
      throw error;
    }
  },

  async getUsers() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return [];
      const uid = currentUser.uid;

      const q = query(
        collection(getDb(), COLLECTION_NAME), 
        and(
          where("type", "==", "user"),
          or(
            where("ownerId", "==", uid),
            where("sharedWith", "array-contains", uid),
            where("uid", "==", uid)
          )
        )
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        ...doc.data()
      })) as UserProfile[];
    } catch (error) {
      console.error("Error getting users: ", error);
      throw error;
    }
  },

  subscribeToUsers(callback: (users: UserProfile[]) => void, teamIds?: string[]) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      callback([]);
      return () => {};
    }
    const uid = currentUser.uid;

    const baseConditions = [
      where("ownerId", "==", uid),
      where("sharedWith", "array-contains", uid),
      where("uid", "==", uid)
    ];

    if (teamIds && teamIds.length > 0) {
      // Add teamId filter - handle up to 30 teams (Firestore limit for 'in')
      const chunks = [];
      for (let i = 0; i < teamIds.length; i += 30) {
        chunks.push(teamIds.slice(i, i + 30));
      }
      baseConditions.push(where("teamId", "in", teamIds.slice(0, 30)));
    }

    const q = query(
      collection(getDb(), COLLECTION_NAME), 
      and(
        where("type", "==", "user"),
        or(...baseConditions)
      )
    );
    return onSnapshot(q, (querySnapshot) => {
      const users = querySnapshot.docs.map(doc => ({
        ...doc.data()
      })) as UserProfile[];
      callback(users);
    });
  },

  subscribeToUserProfile(uid: string, callback: (profile: UserProfile | null) => void) {
    const docRef = doc(getDb(), COLLECTION_NAME, `user_${uid}`);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ ...docSnap.data() } as UserProfile);
      } else {
        callback(null);
      }
    });
  },

  // Global Settings and Custom Shifts (templates)
  async saveSettings(settings: { customShifts?: any[], lunchGroups?: string[] }) {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      const docRef = doc(getDb(), COLLECTION_NAME, `settings_${currentUser.uid}`);
      await setDoc(docRef, {
        ...settings,
        type: 'settings',
        ownerId: currentUser.uid,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving settings: ", error);
      throw error;
    }
  },

  subscribeToSettings(callback: (settings: any) => void) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      callback(null);
      return () => {};
    }
    const docRef = doc(getDb(), COLLECTION_NAME, `settings_${currentUser.uid}`);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      } else {
        callback(null);
      }
    });
  },

  // File Methods
  async uploadProfilePicture(uid: string, file: Blob) {
    try {
      const storageRef = ref(storage, `profilePictures/${uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(getDb(), COLLECTION_NAME, `user_${uid}`), {
        photoURL: url
      });
      return url;
    } catch (error) {
      console.error("Error uploading profile picture: ", error);
      throw error;
    }
  },

  // Sharing Methods
  async createShareRequest(request: Omit<ShareRequest, 'id' | 'createdAt' | 'status'>) {
    try {
      const docRef = await addDoc(collection(getDb(), SHARE_COLLECTION), {
        ...request,
        status: 'pending',
        createdAt: Date.now()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error creating share request: ", error);
      throw error;
    }
  },

  subscribeToShareRequests(email: string, callback: (requests: ShareRequest[]) => void) {
    const q = query(
      collection(getDb(), SHARE_COLLECTION),
      where("toAdminEmail", "==", email),
      where("status", "==", "pending")
    );
    return onSnapshot(q, (querySnapshot) => {
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ShareRequest[];
      callback(requests);
    });
  },

  async acceptShareRequest(requestId: string, teamId: string, adminUid: string) {
    try {
      // Update request status
      await updateDoc(doc(getDb(), SHARE_COLLECTION, requestId), {
        status: 'accepted'
      });

      // Add adminUid to team's sharedWith
      const teamQuery = query(collection(getDb(), COLLECTION_NAME), where("type", "==", "team"));
      const teamSnapshot = await getDocs(teamQuery);
      const teamDoc = teamSnapshot.docs.find(d => d.id === teamId);
      
      if (teamDoc) {
        const teamData = teamDoc.data() as Team;
        const sharedWith = teamData.sharedWith || [];
        if (!sharedWith.includes(adminUid)) {
          await updateDoc(doc(getDb(), COLLECTION_NAME, teamId), {
            sharedWith: [...sharedWith, adminUid]
          });
        }
      }

      // Add adminUid to all users in this team
      const usersQuery = query(
        collection(getDb(), COLLECTION_NAME), 
        where("type", "==", "user"),
        where("teamId", "==", teamId)
      );
      const usersSnapshot = await getDocs(usersQuery);
      
      const updatePromises = usersSnapshot.docs.map(userDoc => {
        const sharedWith = (userDoc.data() as UserProfile).sharedWith || [];
        if (!sharedWith.includes(adminUid)) {
          return updateDoc(doc(getDb(), COLLECTION_NAME, userDoc.id), {
            sharedWith: [...sharedWith, adminUid]
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error accepting share request: ", error);
      throw error;
    }
  },

  async rejectShareRequest(requestId: string) {
    try {
      await updateDoc(doc(getDb(), SHARE_COLLECTION, requestId), {
        status: 'rejected'
      });
    } catch (error) {
      console.error("Error rejecting share request: ", error);
      throw error;
    }
  },

  // Alert Methods
  async createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'readBy' | 'ownerId' | 'sharedWith'>) {
    try {
      const currentUser = auth.currentUser;
      const alertData: any = {
        ...alert,
        createdAt: Date.now(),
        readBy: [],
        ownerId: currentUser?.uid || '',
        sharedWith: [],
        isBotProcessed: false
      };

      if (alertData.scheduledFor === undefined) {
        delete alertData.scheduledFor;
      }
      
      const docRef = await addDoc(collection(getDb(), ALERTS_COLLECTION), alertData);
      return docRef.id;
    } catch (error) {
      console.error("Error creating alert: ", error);
      throw error;
    }
  },

  subscribeToAlerts(userId: string, teamId: string | undefined, callback: (alerts: Alert[]) => void) {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    const q = query(
      collection(getDb(), ALERTS_COLLECTION),
      where("createdAt", ">", oneWeekAgo)
    );

    return onSnapshot(q, (querySnapshot) => {
      const allAlerts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Alert[];

      const now = Date.now();
      const relevantAlerts = allAlerts.filter(alert => {
        if (alert.scheduledFor && alert.scheduledFor > now) return false;
        if (alert.hiddenBy && alert.hiddenBy.includes(userId)) return false;
        if (alert.targetAudience === 'all') return true;
        if (alert.targetAudience === 'team' && alert.targetId === teamId) return true;
        if (alert.targetAudience === 'user' && alert.targetId === userId) return true;
        return false;
      });

      const seen = new Set<string>();
      const deduplicated = relevantAlerts
        .sort((a, b) => b.createdAt - a.createdAt)
        .filter(alert => {
          const key = `${alert.title}|${alert.message}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      callback(deduplicated);
    });
  },

  subscribeToAdminAlerts(callback: (alerts: Alert[]) => void) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      callback([]);
      return () => {};
    }
    const uid = currentUser.uid;

    const q = query(
      collection(getDb(), ALERTS_COLLECTION),
      where("ownerId", "==", uid)
    );

    return onSnapshot(q, (querySnapshot) => {
      const allAlerts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Alert[];

      const seen = new Set<string>();
      const deduplicated = allAlerts
        .sort((a, b) => b.createdAt - a.createdAt)
        .filter(alert => {
          const key = `${alert.title}|${alert.message}|${alert.targetAudience}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

      callback(deduplicated);
    });
  },

  async markAlertAsRead(alertId: string, userId: string) {
    try {
      const docRef = doc(getDb(), ALERTS_COLLECTION, alertId);
      const alertDoc = await getDocs(query(collection(getDb(), ALERTS_COLLECTION)));
      const targetDoc = alertDoc.docs.find(d => d.id === alertId);
      if (targetDoc) {
        const data = targetDoc.data() as Alert;
        const readBy = data.readBy || [];
        if (!readBy.includes(userId)) {
          await updateDoc(docRef, {
            readBy: [...readBy, userId]
          });
        }
      }
    } catch (error) {
      console.error("Error marking alert as read: ", error);
      throw error;
    }
  },
  
  async hideAlert(alertId: string, userId: string) {
    try {
      const docRef = doc(getDb(), ALERTS_COLLECTION, alertId);
      const alertDoc = await getDocs(query(collection(getDb(), ALERTS_COLLECTION)));
      const targetDoc = alertDoc.docs.find(d => d.id === alertId);
      if (targetDoc) {
        const data = targetDoc.data() as Alert;
        if (data.targetAudience === 'user' && data.targetId === userId) {
           await deleteDoc(docRef);
           return;
        }

        const hiddenBy = data.hiddenBy || [];
        if (!hiddenBy.includes(userId)) {
          await updateDoc(docRef, {
            hiddenBy: [...hiddenBy, userId]
          });
        }
      }
    } catch (error) {
      console.error("Error hiding alert: ", error);
      throw error;
    }
  },

  async deleteAlert(alertId: string) {
    try {
      await deleteDoc(doc(getDb(), ALERTS_COLLECTION, alertId));
    } catch (error) {
      console.error("Error deleting alert: ", error);
      throw error;
    }
  }
};
