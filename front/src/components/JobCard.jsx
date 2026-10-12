export default function JobCard({ job, onSelect }) {
  const formatEmploymentType = (type) => {
    if (!type) return 'Full Time';
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <article className="job-card" onClick={() => onSelect(job)}>
      <div className="job-card-header">
        <div className="job-company-info">
          <div className="company-logo-fallback">
            {job.companyLogo ? (
              <img src={job.companyLogo} alt={job.companyName || 'Company'} />
            ) : (
              <span>{job.companyName ? job.companyName.charAt(0).toUpperCase() : 'C'}</span>
            )}
          </div>
          <div>
            <h3 className="job-title">{job.title}</h3>
            <span className="company-name">{job.companyName || 'Confidential Company'}</span>
          </div>
        </div>

        <span className={`emp-badge emp-${(job.employmentType || 'full_time').toLowerCase()}`}>
          {formatEmploymentType(job.employmentType)}
        </span>
      </div>

      <div className="job-meta-row">
        <span className="meta-tag">
          <span className="meta-icon">📍</span>
          {job.location || 'Remote / Unspecified'}
        </span>
        {job.category && (
          <span className="meta-tag">
            <span className="meta-icon">🏷️</span>
            {job.category}
          </span>
        )}
        {job.salaryRange && (
          <span className="meta-tag salary-tag">
            <span className="meta-icon">💰</span>
            {job.salaryRange}
          </span>
        )}
      </div>

      {job.description && (
        <p className="job-card-snippet">
          {job.description.length > 150
            ? `${job.description.substring(0, 150)}...`
            : job.description}
        </p>
      )}

      <div className="job-card-footer">
        <span className="posted-date">
          {job.createdAt ? `Posted ${formatDate(job.createdAt)}` : ''}
        </span>
        <button
          type="button"
          className="btn-view-details"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(job);
          }}
        >
          View Details &rarr;
        </button>
      </div>
    </article>
  );
}
