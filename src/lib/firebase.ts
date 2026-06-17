// @ts-nocheck - Firebase admin types are not properly exported
import admin from "firebase-admin"
import config from "../config/index.js"

let firebaseApp: any = null
let firestoreDb: any = null

export const getFirebaseApp = (): any => {
  if (firebaseApp) {
    return firebaseApp
  }

  if (!config.firebaseServiceAccountKey || !config.firebaseProjectId) {
    throw new Error("Firebase configuration is missing")
  }

  try {
    const serviceAccount = JSON.parse(config.firebaseServiceAccountKey)

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: config.firebaseProjectId,
    })

    firestoreDb = firebaseApp.firestore()
  } catch (error) {
    console.error("Failed to initialize Firebase:", error)
    throw new Error("Failed to initialize Firebase Admin SDK")
  }

  return firebaseApp
}

export const getFirestore = (): any => {
  if (!firestoreDb) {
    getFirebaseApp()
  }
  return firestoreDb
}

export interface SendResult {
  success: string[]
  failed: string[]
}

export const sendNotification = async (
  tokens: string[],
  notification: {
    title: string
    body: string
  },
): Promise<SendResult> => {
  if (tokens.length === 0) {
    return { success: [], failed: [] }
  }

  try {
    const app = getFirebaseApp()
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      tokens: tokens,
    }

    const response = await app.messaging().sendMulticast(message)

    const success: string[] = []
    const failed: string[] = []

    response.responses.forEach((resp: any, idx: number) => {
      if (resp.success) {
        success.push(tokens[idx])
      } else {
        // Check if the error is due to invalid token
        if (
          resp.error?.code === "messaging/registration-token-not-registered" ||
          resp.error?.code === "messaging/invalid-recipient" ||
          resp.error?.code === "messaging/invalid-registration-token"
        ) {
          failed.push(tokens[idx])
        }
      }
    })

    return { success, failed }
  } catch (error) {
    console.error("Error sending notification:", error)
    return { success: [], failed: tokens }
  }
}

// Firestore functions for FCM token management
const FCM_TOKENS_COLLECTION = "fcm_tokens"

export const registerToken = async (
  userId: string,
  token: string,
  deviceInfo?: string,
): Promise<void> => {
  const db = getFirestore()
  const tokenRef = db.collection(FCM_TOKENS_COLLECTION).doc(token)

  await tokenRef.set({
    userId,
    deviceInfo: deviceInfo || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })
}

export const removeToken = async (token: string): Promise<void> => {
  const db = getFirestore()
  await db.collection(FCM_TOKENS_COLLECTION).doc(token).delete()
}

export const getTokensByUserId = async (userId: string): Promise<string[]> => {
  const db = getFirestore()
  const snapshot = await db
    .collection(FCM_TOKENS_COLLECTION)
    .where("userId", "==", userId)
    .get()

  const tokens: string[] = []
  snapshot.forEach((doc: any) => {
    tokens.push(doc.id)
  })

  return tokens
}

export const cleanupInvalidTokens = async (tokens: string[]): Promise<void> => {
  if (tokens.length === 0) return

  const db = getFirestore()
  const batch = db.batch()

  tokens.forEach((token) => {
    const ref = db.collection(FCM_TOKENS_COLLECTION).doc(token)
    batch.delete(ref)
  })

  await batch.commit()
}
