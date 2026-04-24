import Link from "next/link";

import {
  CheckIcon,
  ClockIcon,
  PauseIcon,
  ReviewedIcon,
  getButtonClassName,
} from "@/components/ui";

import styles from "./tutor-profile.module.css";

export default function TutorProfileNotFound() {
  return (
    <article className={styles.page}>
      <section aria-labelledby="profile-unavailable-title" className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.identityText}>
            <p className={styles.eyebrow}>Tutor profile</p>
            <h1 id="profile-unavailable-title">This tutor profile is not available.</h1>
          </div>

          <p className={styles.bio}>
            The tutor may have paused bookings, hidden their profile, or not finished
            review yet. Start a match to see tutors you can book now.
          </p>

          <div className={styles.actionRow} aria-label="Unavailable profile actions">
            <Link className={getButtonClassName()} href="/match">
              Find available tutors
            </Link>
            <Link className={getButtonClassName({ variant: "secondary" })} href="/">
              Return home
            </Link>
          </div>
        </div>

        <aside aria-label="Available tutor preview" className={styles.unavailablePreview}>
          <div aria-hidden="true" className={styles.matchPreviewGraphic}>
            <div className={styles.previewHeader}>
              <div className={styles.graphicAvatar}>IB</div>
              <div>
                <p>Available tutor</p>
                <strong>English A HL support</strong>
              </div>
            </div>

            <div className={styles.previewNeed}>
              <span>Need</span>
              <strong>IA feedback</strong>
              <strong>This week</strong>
            </div>

            <ul className={styles.previewChecks}>
              <li>
                <span aria-hidden="true" className={styles.previewCheckIcon}>
                  <CheckIcon />
                </span>
                <span>Public profile</span>
              </li>
              <li>
                <span aria-hidden="true" className={styles.previewCheckIcon}>
                  <CheckIcon />
                </span>
                <span>Reviewed proof</span>
              </li>
              <li>
                <span aria-hidden="true" className={styles.previewCheckIcon}>
                  <CheckIcon />
                </span>
                <span>Bookable times</span>
              </li>
            </ul>
          </div>

          <div>
            <p className={styles.darkEyebrow}>Try another match</p>
            <h2>See tutors who are ready to book.</h2>
            <p>
              Tell us the subject, deadline, and kind of support you need. We will
              show tutors with public profiles and clear next steps.
            </p>
          </div>
        </aside>
      </section>

      <section aria-labelledby="profile-help-title" className={styles.trustSection}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>What happened</p>
            <h2 id="profile-help-title">Why a tutor profile might be missing</h2>
          </div>
        </div>

        <div className={styles.trustGrid}>
          <article className={styles.trustItem}>
            <span aria-hidden="true" className={styles.reasonIcon}>
              <PauseIcon />
            </span>
            <h3>Paused by the tutor</h3>
            <p>
              Some tutors take breaks or stop accepting new students for a while.
            </p>
          </article>
          <article className={styles.trustItem}>
            <span aria-hidden="true" className={styles.reasonIcon}>
              <ReviewedIcon />
            </span>
            <h3>Not public yet</h3>
            <p>A profile stays hidden until the tutor review is finished.</p>
          </article>
          <article className={styles.trustItem}>
            <span aria-hidden="true" className={styles.reasonIcon}>
              <ClockIcon />
            </span>
            <h3>No clear booking path</h3>
            <p>
              If a tutor is not ready to book, we point you back to matching.
            </p>
          </article>
        </div>
      </section>
    </article>
  );
}
