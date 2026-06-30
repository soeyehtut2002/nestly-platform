import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Shield, UserCheck, AlertTriangle } from 'lucide-react';

const Legal = () => {
  const { docType } = useParams();

  const renderTerms = () => (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
        <FileText />
        Terms of Service
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Effective Date: June 29, 2026</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
        <p>
          Welcome to <strong>Nestly</strong>. By registering or accessing this platform, you agree to comply with and be bound by these Terms of Service.
        </p>
        
        <div style={{ background: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid var(--accent-red)', padding: '1rem', borderRadius: '4px' }}>
          <strong>1. STANCE ON AFFILIATION AND TRANSACTION RESPONSIBILITY</strong><br />
          Nestly is a strictly **independent community intermediary platform**. It is NOT affiliated with, sponsored by, or endorsed by any condominium developers, juristic offices, or official committee managements. Nestly is NOT an e-commerce owner or retailer. All agreements, sales, deliveries, and payments occur directly and off-platform between users. We do not assume any liability for transactions.
        </div>

        <h3>2. USER ELIGIBILITY AND REGISTRATION</h3>
        <p>
          You must be an actual resident (owner or tenant) of the condominium units associated with your selected location to use restricted parts of this application. You must provide a valid Room Number and proof of residency during registration. Providing fraudulent room numbers will result in immediate account suspension.
        </p>

        <h3>3. PROHIBITED CONDUCT</h3>
        <p>
          Users may not list, request, or deliver:
        </p>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <li>Illegal substances, narcotics, prescription drugs, or alcohol.</li>
          <li>Weapons, explosives, ammunition, or fire hazards.</li>
          <li>Adult content, pornography, or sexually explicit materials.</li>
          <li>Counterfeit goods, copyright-infringing items, or stolen materials.</li>
          <li>Gambling coordinates, schemes, or financial fraudulent materials.</li>
        </ul>

        <h3>4. ACCOUNT SUSPENSION</h3>
        <p>
          Administrators reserve the right to suspend any resident profile or remove listings immediately and without notice upon receiving reports of fraud, harassment, or violation of Thai law.
        </p>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--secondary)' }}>
        <Shield />
        Privacy Policy (PDPA Thailand)
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Effective Date: June 29, 2026</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
        <p>
          This Privacy Policy describes how Nestly collects, processes, and stores personal data in compliance with the **Personal Data Protection Act (PDPA) B.E. 2562** of Thailand.
        </p>

        <h3>1. DATA WE COLLECT</h3>
        <p>
          To maintain security and verify residency, we collect:
        </p>
        <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <li>Full name, email address, and telephone number.</li>
          <li>Condo room number (e.g. 402/125).</li>
          <li>Verification uploads (Thai ID card/Passport, utility bills indicating residency).</li>
          <li>IP addresses, browser details, and chat log history in case of dispute investigations.</li>
        </ul>

        <h3>2. PURPOSE OF DATA COLLECTION</h3>
        <p>
          Collected data is strictly used to authenticate resident accounts, prevent off-site fraudulent listings, display verified room numbers on item details, and coordinate in-app buyer/seller chat.
        </p>

        <div style={{ background: 'rgba(16, 185, 129, 0.05)', borderLeft: '4px solid var(--secondary)', padding: '1rem', borderRadius: '4px' }}>
          <strong>3. DATA MINIMIZATION AND RETENTION GUIDELINES</strong><br />
          Verification documents (ID Card/Residency proofs) are used solely for verification. Secure URLs containing document photos are completely redacted or deleted from servers 30 days after verification is completed.
        </div>

        <h3>4. USER RIGHTS (RIGHT TO ERASURE)</h3>
        <p>
          Under the PDPA, users maintain the right to withdraw consent, inspect stored details, or request total account and data deletion ("Right to be Forgotten"). To exercise your erasure rights, contact admin via profile controls.
        </p>
      </div>
    </div>
  );

  const renderAgreement = () => (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
        <UserCheck />
        Seller Agreement & Affirmation
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Effective Date: June 29, 2026</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
        <p>
          Before creating listings or acting as a delivery runner on Nestly, you must agree to this Seller Agreement.
        </p>

        <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px dashed var(--border-glass-glow)', padding: '1rem', borderRadius: '4px' }}>
          <strong>MANDATORY AFFIRMATION</strong><br />
          Every time you post a listing, you digitally affirm the statement:<br />
          <em style={{ color: 'var(--primary)', fontStyle: 'normal', fontWeight: 600 }}>"I am legally allowed to sell these products/services under Thai law."</em>
        </div>

        <h3>1. LEGAL COMPLIANCE FOR COMMERCIAL SALES</h3>
        <p>
          Sellers are individually and solely responsible for compliance with all local codes, including FDA (Food and Drug Administration Thailand) certificates for prepared foods, tax reporting for business operations, and licensing for skilled labor (handyman/cleaners).
        </p>

        <h3>2. PROHIBITED TRANSACTIONS</h3>
        <p>
          You agree not to list counterfeit goods, weapons, home-brewed liquors, or medicines. Infringing items will be deleted immediately, and user credentials will be submitted to authorities if required by official investigation.
        </p>
      </div>
    </div>
  );

  const renderGuidelines = () => (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
        <AlertTriangle />
        Community Guidelines
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Effective Date: June 29, 2026</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', lineHeight: '1.6', fontSize: '0.95rem' }}>
        <p>
          Nestly is created to promote a friendly, safe, and helpful neighborhood environment. We expect all residents to adhere to these core guidelines.
        </p>

        <h3>1. RESPECT AND TRUST</h3>
        <p>
          Do not harass, spam, or bully other residents. Treat delivery runners and handymen with respect. In-app chats should be used strictly for transactional communications and community help.
        </p>

        <h3>2. TRUTHFUL LISTINGS</h3>
        <p>
          Provide accurate pricing and descriptions. If a listing is sold out, delete or suspend the listing. Do not post misleading images.
        </p>

        <h3>3. REPORT ABUSE DIRECTLY</h3>
        <p>
          If you encounter spam, illegal postings, or fraudulent behavior, click the "Report Abuse" button immediately. Our administrators inspect the queue constantly and take actions.
        </p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '2.5rem', animation: 'fadeIn 0.4s ease' }}>
      {/* Sidebar Links */}
      <div className="glass-panel" style={{ padding: '1.5rem', height: 'fit-content' }}>
        <h4 style={{ marginBottom: '1rem', color: '#fff' }}>Legal Documents</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>
          <Link to="/legal/terms" style={{ color: docType === 'terms' ? 'var(--primary)' : 'var(--text-secondary)' }}>Terms of Service</Link>
          <Link to="/legal/privacy" style={{ color: docType === 'privacy' ? 'var(--secondary)' : 'var(--text-secondary)' }}>Privacy Policy (PDPA)</Link>
          <Link to="/legal/seller-agreement" style={{ color: docType === 'seller-agreement' ? 'var(--primary)' : 'var(--text-secondary)' }}>Seller Agreement</Link>
          <Link to="/legal/guidelines" style={{ color: docType === 'guidelines' ? 'var(--primary)' : 'var(--text-secondary)' }}>Community Guidelines</Link>
        </div>
      </div>

      {/* Document View */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        {docType === 'terms' && renderTerms()}
        {docType === 'privacy' && renderPrivacy()}
        {docType === 'seller-agreement' && renderAgreement()}
        {docType === 'guidelines' && renderGuidelines()}
        {!['terms', 'privacy', 'seller-agreement', 'guidelines'].includes(docType) && renderTerms()}
      </div>
    </div>
  );
};

export default Legal;
