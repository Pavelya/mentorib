import Link from "next/link";

import { getButtonClassName, StatusBadge } from "@/components/ui";

import styles from "./tutor-profile.module.css";

export default function TutorProfileNotFound() {
  return (
    <article className={styles.page}>
      <section aria-labelledby="profile-unavailable-title" className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.unavailableLabelRow}>
            <StatusBadge tone="warning">Profile unavailable</StatusBadge>
            <StatusBadge tone="info">Tutor matching is open</StatusBadge>
          </div>

          <div className={styles.identityText}>
            <p className={styles.eyebrow}>Tutor profile</p>
            <h1 id="profile-unavailable-title">This tutor is not available right now.</h1>
          </div>

          <p className={styles.bio}>
            The profile may be paused, unpublished, or still waiting for approval.
            You can keep going by matching from the IB help you need now.
          </p>

          <div className={styles.actionRow} aria-label="Unavailable profile actions">
            <Link className={getButtonClassName()} href="/match">
              Find an IB tutor
            </Link>
            <Link className={getButtonClassName({ variant: "secondary" })} href="/">
              Return home
            </Link>
          </div>
        </div>

        <aside aria-label="Tutor profile preview" className={styles.unavailablePreview}>
          <div aria-hidden="true" className={styles.profileCardGraphic}>
            <div className={styles.graphicHeader}>
              <div className={styles.graphicAvatar}>IB</div>
              <div className={styles.graphicLines}>
                <span />
                <span />
              </div>
            </div>

            <div className={styles.graphicFitBlock}>
              <span />
              <span />
              <span />
            </div>

            <div className={styles.graphicProofGrid}>
              <span>Fit</span>
              <span>Proof</span>
              <span>Time</span>
            </div>
          </div>

          <div>
            <p className={styles.darkEyebrow}>Next best step</p>
            <h2>Start from the learning need instead.</h2>
            <p>
              Matching can surface tutors who are public, reviewed, and ready for a
              booking handoff.
            </p>
          </div>
        </aside>
      </section>

      <section aria-labelledby="profile-help-title" className={styles.trustSection}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>What happened</p>
            <h2 id="profile-help-title">We only show tutor profiles that are ready.</h2>
          </div>
        </div>

        <div className={styles.trustGrid}>
          <article className={styles.trustItem}>
            <h3>Published profile</h3>
            <p>
              A tutor profile has to be public before it can be viewed by students
              and parents.
            </p>
          </article>
          <article className={styles.trustItem}>
            <h3>Reviewed trust proof</h3>
            <p>
              Visible proof should come from approved public information, not private
              application files.
            </p>
          </article>
          <article className={styles.trustItem}>
            <h3>Booking confidence</h3>
            <p>
              The profile should make availability and next steps clear before you
              spend time evaluating it.
            </p>
          </article>
        </div>
      </section>
    </article>
  );
}
