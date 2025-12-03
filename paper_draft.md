# MNU Events Platform: A Comprehensive Student Engagement and Management System
## Capstone Project - Second Draft

**Date:** December 3, 2025
**Version:** 2.0

---

## Abstract

The MNU Events Platform is a centralized web application designed to enhance student life at Maqsut Narikbayev University (MNU). It addresses the fragmentation of student engagement tools by integrating event management, club administration, service marketplaces, and gamification into a single ecosystem. The platform serves five distinct user roles: Students, Organizers, Moderators, Administrators, and External Partners. Key features include a robust QR-based check-in system with four distinct modes, a gamified "Community Service Index" (CSI) to incentivize participation, and a monetization framework involving paid events, advertisements, and partner commissions. This paper details the system's architecture, development methodology, implementation of key algorithms, and its potential impact on the university community.

---

## 1. Introduction

### 1.1 Background and Problem Statement
University life is more than just academics; it involves social interaction, extracurricular activities, and community service. However, at MNU, the management of these activities has historically been fragmented. Students struggle to find information about events scattered across various social media channels. Club organizers lack efficient tools for tracking attendance and managing members. The administration has limited visibility into real student engagement levels. Furthermore, there is no centralized marketplace for student-to-student services (tutoring, equipment sharing, etc.), and external partners face barriers in reaching the student demographic effectively.

### 1.2 Objectives
The primary objective of this project is to develop a comprehensive digital platform that:
1.  **Centralizes Information:** Provides a single source of truth for all university events and club activities.
2.  **Streamlines Management:** Offers tools for organizers to create events, track registrations, and validate attendance via QR codes.
3.  **Incentivizes Engagement:** Implements a gamification system (CSI) that rewards students for active participation.
4.  **Facilitates Commerce:** Enables a secure marketplace for student services and a platform for external partners to host paid events.
5.  **Ensures Quality:** Includes a moderation system to maintain the integrity and safety of the content.

### 1.3 Scope
The project scope encompasses the development of a web-based application with a React frontend and a NestJS backend.
*   **User Roles:** Student, Organizer, Moderator, Admin, External Partner.
*   **Core Modules:** Auth, Events, Clubs, Marketplace, Gamification, Payments, Analytics.
*   **Platform:** Web application optimized for desktop and mobile web browsers. Native mobile apps are out of scope for this phase.

---

## 2. Literature Review

### 2.1 Summary of Relevant Research
Research into student engagement systems highlights the positive correlation between extracurricular participation and academic success. Digital platforms that reduce friction in finding and attending events have been shown to increase student involvement. Gamification in educational contexts—using badges, leaderboards, and points—has proven effective in sustaining long-term user engagement.

### 2.2 Analysis of Existing Solutions
*   **Eventbrite:** Powerful for ticketing but lacks university-specific context (clubs, student verification) and gamification.
*   **CampusGroups / Anthology:** Enterprise solutions that are often expensive and complex to customize for specific university needs like the CSI system.
*   **Social Media (Instagram/Telegram):** High reach but poor organization; information is unstructured and difficult to search or track analytically.

The MNU Events Platform bridges these gaps by combining the utility of event management tools with the engagement of social platforms, tailored specifically for the MNU context.

---

## 3. Methodology

### 3.1 Data Collection and Analysis Techniques
*   **Requirement Gathering:** Interviews with student council members, club presidents, and university administration to define core needs.
*   **User Feedback:** Beta testing with a focus group of 50 students to refine UI/UX and validate the gamification mechanics.
*   **Analytics:** The system itself collects data on event popularity, check-in rates, and peak usage times to inform future development.

### 3.2 Software Tools and Technologies
The project utilizes a modern, scalable tech stack:
*   **Backend:** NestJS (Node.js framework) for robust, modular API development.
*   **Database:** PostgreSQL with Prisma ORM for type-safe database interactions.
*   **Frontend:** React (Vite) for a dynamic, responsive user interface.
*   **Styling:** Tailwind CSS for rapid, utility-first design.
*   **Containerization:** Docker and Docker Compose for consistent development and deployment environments.
*   **Key Libraries:**
    *   `html5-qrcode`: For in-browser QR code scanning.
    *   `recharts`: For data visualization in dashboards.
    *   `passport-jwt`: For secure authentication.

---

## 4. Design and Architecture

### 4.1 System Architecture
The system follows a monolithic architecture with modular separation of concerns, suitable for the current scale while allowing for future microservices extraction.
*   **Client Layer:** React SPA interacting with the backend via RESTful APIs.
*   **API Layer:** NestJS controllers handling request validation, authentication (Guards), and routing.
*   **Service Layer:** Business logic encapsulation (e.g., `CheckinService`, `GamificationService`).
*   **Data Layer:** PostgreSQL database managing entities like Users, Events, Registrations, and Transactions.

### 4.2 System Flowcharts
*(Note: Diagrams to be included in the final visual submission)*
1.  **Event Creation Flow:** Organizer submits form -> Validation -> Status: PENDING_MODERATION -> Moderator Approves -> Status: UPCOMING.
2.  **Ticket Purchase Flow:** Student clicks Buy -> Views Kaspi details -> Uploads Receipt -> Partner Verifies -> Ticket QR Generated.
3.  **Check-in Flow:**
    *   *Type 1 (Organizer Scans):* Organizer scans Student QR -> Validate -> Mark Attended -> Award Points.
    *   *Type 2 (Student Scans):* Student scans Event QR -> Validate Location/Time -> Mark Attended -> Award Points.

---

## 5. Code Implementation

### 5.1 Key Functionalities and Algorithms

#### 5.1.1 Automatic Check-in Mode Detection
To simplify the user experience, the system automatically determines the appropriate check-in mode based on event properties.
```typescript
// backend/src/common/utils/checkin-mode.utils.ts
export function determineCheckInMode(event: Event): CheckInMode {
  if (event.isExternal) {
    // External partners always scan students for security/analytics
    return CheckInMode.ORGANIZER_SCANS_STUDENT; 
  }
  if (event.isPaid) {
    // Paid internal events require strict ticket validation
    return CheckInMode.ORGANIZER_SCANS_STUDENT;
  }
  // Free internal events allow self-check-in for speed
  return CheckInMode.STUDENT_SCANS_EVENT;
}
```

#### 5.1.2 Gamification Logic
The system rewards engagement through a multi-tiered achievement system.
*   **Points:** Awarded immediately upon successful check-in.
*   **Levels:** Calculated dynamically based on total points (Newcomer < 100, Active < 300, Leader < 600, Legend > 600).
*   **Badges:** Triggers run asynchronously to check conditions (e.g., "Attended 5 Tech Events") and award badges.

#### 5.1.3 Partner Commission Calculation
The system automatically handles revenue sharing for external partners.
```typescript
const COMMISSION_RATE = 0.10; // 10%
const commissionAmount = ticketPrice * COMMISSION_RATE;
// Logic to track accumulated debt for the partner
await this.prisma.partner.update({
  where: { id: partnerId },
  data: { commissionDebt: { increment: commissionAmount } }
});
```

---

## 6. Project Impact

### 6.1 Potential Impact and Benefits
*   **For Students:** Centralized access to opportunities, recognition of extracurricular achievements (CSI), and a safe platform for peer-to-peer services.
*   **For Organizers:** Drastically reduced administrative burden (automated attendance, analytics) and better promotion tools.
*   **For Administration:** Data-driven insights into student life and a streamlined process for managing campus activities.

### 6.2 Target Audience
*   **Primary:** 2,000+ MNU Students.
*   **Secondary:** 50+ Student Clubs and Organizations.
*   **Tertiary:** External businesses (cafes, training centers) targeting the student demographic.

### 6.3 Expected Outcomes
*   Increase in average event attendance by 20%.
*   Reduction in "spam" announcements in university chats.
*   Creation of a verifiable "Student Activity Record" via the CSI system.

---

## 7. Challenges and Mitigation

### 7.1 Identified Challenges or Risks
1.  **Adoption Rate:** Students may be reluctant to switch from familiar social media channels.
2.  **Internet Connectivity:** QR check-ins rely on stable internet, which can be spotty in some campus areas.
3.  **Payment Trust:** Manual verification of Kaspi transfers is prone to human error or fraud.
4.  **Security:** Risks of IDOR attacks or JWT theft in public computers.

### 7.2 Proposed Mitigation Strategies
1.  **Marketing:** Launching an "Early Adopter" program with exclusive badges and prizes.
2.  **Offline Mode:** (Future) Caching tickets locally; currently, the lightweight frontend minimizes data usage.
3.  **Verification UI:** A dedicated interface for organizers to view receipt screenshots side-by-side with transaction details.
4.  **Security Audits:** Implemented HMAC signatures for webhooks, strict Role-Based Access Control (RBAC), and IDOR protection middleware.

---

## 8. Business Aspects

### 8.1 Business Model
The platform operates on a freemium and commission-based model:
1.  **Commissions:** 10% fee on all paid tickets sold by external partners.
2.  **Paid Slots:** Partners get 2 free events/month; additional slots cost 3,000 KZT.
3.  **Premium Subscriptions:** Students pay 500 KZT/month for enhanced marketplace limits (10 listings vs. 3) and profile customization.
4.  **Advertising:** Paid placement for banners (Top, Feed, Story) ranging from 5,000 to 20,000 KZT.

### 8.2 Costs
*   **Hosting:** Estimated $20-50/month (VPS + Database).
*   **Maintenance:** Student developer time (currently volunteer/academic credit).
*   **Marketing:** Minimal internal promotion costs.

---

## 9. Discussion
The development of the MNU Events Platform has demonstrated the viability of a student-centric ecosystem. The successful implementation of the "External Partner" role expands the university's ecosystem beyond campus borders, creating value for local businesses. The "Moderator" role ensures that this expansion does not compromise the quality or safety of the environment. The modular architecture allows for easy addition of new features, such as the planned mobile application.

---

## 10. Conclusion
The MNU Events Platform represents a significant step forward in the digitalization of the university experience. By consolidating disparate processes into a unified, gamified, and user-friendly application, it solves real problems for students and administrators alike. The project is currently at 99% completion (Release Candidate), with all core modules functional and tested. The next phase involves a beta launch with a pilot group to gather real-world usage data.

---

## 11. Bibliography
1.  *Student Engagement and Academic Success*, Journal of Higher Education.
2.  *Gamification in Education: A Systematic Mapping Study*, Computers & Education.
3.  *NestJS Documentation*, https://docs.nestjs.com/
4.  *React Documentation*, https://react.dev/

---

## 12. Appendices
*   **Appendix A:** User Manual (Link to `README.md`)
*   **Appendix B:** API Documentation (Swagger Export)
*   **Appendix C:** Database Schema Diagram
