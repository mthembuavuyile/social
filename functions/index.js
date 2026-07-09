/**
 * Civicly Civic Network - Secure Backend Cloud Functions
 * 
 * In production, sensitive business logic (financial escrow payouts, dispute timeouts, 
 * reputation modifications, and vote verification) must run on a secure server environment 
 * to prevent client-side manipulation.
 * 
 * Deploy these triggers to Firebase Functions by running:
 *   firebase deploy --only functions
 */

const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * Trigger: onPostUpdate
 * Listens for updates in Firestore post documents.
 * Safely releases funds from escrow to the fixer's wallet once 3 verifications are reached,
 * or escalates the post to "dispute court" (jury status) if 3 disputes are logged.
 */
exports.onPostUpdate = onDocumentUpdated("posts/{postId}", async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  const postId = event.params.postId;

  if (!afterData) return;

  // 1. ESCROW RELEASE: Handle Neighbor Verification Audits
  const beforeVerifications = Object.keys(beforeData.verifications || {}).length;
  const afterVerifications = Object.keys(afterData.verifications || {}).length;

  if (afterVerifications >= 3 && beforeVerifications < 3 && afterData.status === "resolved") {
    logger.info(`Post ${postId} has reached 3 neighbor verifications! Initiating payout transaction.`);
    const fixerUid = afterData.assignedFixerUid;
    const payoutAmount = afterData.compensationValue || 150;

    if (!fixerUid) {
      logger.error(`Post ${postId} verified but no assigned fixer UID found! Payout aborted.`);
      return;
    }

    try {
      await db.runTransaction(async (transaction) => {
        const postRef = db.doc(`posts/${postId}`);
        const fixerEarningsRef = db.doc(`earnings/${fixerUid}`);
        const fixerRepRef = db.doc(`reputations/${fixerUid}`);

        // Update post status to complete
        transaction.update(postRef, {
          status: "resolved_complete",
          payoutCompletedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Add to fixer simulated earnings
        const earningsDoc = await transaction.get(fixerEarningsRef);
        const currentEarnings = earningsDoc.exists() ? (earningsDoc.data().value || 0) : 0;
        transaction.set(fixerEarningsRef, { value: currentEarnings + payoutAmount }, { merge: true });

        // Add +50 Reputation Points (Civic Points) to fixer
        const repDoc = await transaction.get(fixerRepRef);
        const currentRep = repDoc.exists() ? (repDoc.data().value || 50) : 50;
        transaction.set(fixerRepRef, { value: currentRep + 50 }, { merge: true });
      });

      logger.info(`Successfully released R${payoutAmount} escrow and awarded +50 Reputation to fixer: ${fixerUid}`);
    } catch (error) {
      logger.error(`Escrow transaction failed for post ${postId}:`, error);
    }
  }

  // 2. DISPUTE REFERRAL: Handle Conflict Escalation
  const beforeDisputes = Object.keys(beforeData.disputes || {}).length;
  const afterDisputes = Object.keys(afterData.disputes || {}).length;

  if (afterDisputes >= 3 && beforeDisputes < 3 && afterData.status === "resolved") {
    logger.warn(`Post ${postId} has received 3 disputes. Escalating to Dispute Court (Jury review).`);
    try {
      await db.doc(`posts/${postId}`).update({
        status: "jury",
        disputedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      logger.info(`Post ${postId} status successfully escalated to 'jury'.`);
    } catch (error) {
      logger.error(`Failed to escalate post ${postId} to jury:`, error);
    }
  }

  // 3. SPAM ESCALATION: Handle Flags
  const beforeFlags = Object.keys(beforeData.flags || {}).length;
  const afterFlags = Object.keys(afterData.flags || {}).length;

  if (afterFlags >= 3 && beforeFlags < 3 && afterData.status !== "jury") {
    logger.warn(`Post ${postId} flagged by 3 different users. Sending to Jury Court.`);
    try {
      await db.doc(`posts/${postId}`).update({
        status: "jury",
        flaggedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      logger.error(`Failed to flag post ${postId} to jury:`, error);
    }
  }
});
