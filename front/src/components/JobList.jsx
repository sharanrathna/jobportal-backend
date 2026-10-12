import { useState, useEffect, useCallback } from 'react';
import { jobApi } from '../services/api';
import JobCard from './JobCard';
import JobDetailsModal from './JobDetailsModal';

export default function JobList({ currentUser, onNavigateToLogin }) {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    title: '',
    location: '',
    category: '',
    employmentType: '',
  });

  // Pagination state
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchJobs = useCallback(async (targetPage = 0) => {
    setLoading(true);
    setError('');

    try {
      const data = await jobApi.getJobs({
        title: filters.title,
        location: filters.location,
        category: filters.category,
        employmentType: filters.employmentType || undefined,
        page: targetPage,
        size: 9,
      });

      setJobs(data.content || []);
      setPage(data.number || 0);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to load job listings. Please try again.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchJobs(0);
  }, [fetchJobs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs(0);
  };

  const handleResetFilters = () => {
    setFilters({
      title: '',
      location: '',
      category: '',
      employmentType: '',
    });
  };

  return (
    <div className="jobs-container">
      {/* Search and Filter Panel */}
      <section className="search-panel" aria-label="Job search and filters">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="filter-grid">
            <div className="filter-field">
              <label htmlFor="filter-title">Job Title or Keyword</label>
              <div className="input-with-icon">
                <span className="input-icon">🔍</span>
                <input
                  id="filter-title"
                  name="title"
                  type="text"
                  placeholder="e.g. Software Engineer, Designer"
                  value={filters.title}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <div className="filter-field">
              <label htmlFor="filter-location">Location</label>
              <div className="input-with-icon">
                <span className="input-icon">📍</span>
                <input
                  id="filter-location"
                  name="location"
                  type="text"
                  placeholder="e.g. New York, Remote"
                  value={filters.location}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <div className="filter-field">
              <label htmlFor="filter-category">Category</label>
              <div className="input-with-icon">
                <span className="input-icon">🏷️</span>
                <input
                  id="filter-category"
                  name="category"
                  type="text"
                  placeholder="e.g. Engineering, Marketing"
                  value={filters.category}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <div className="filter-field">
              <label htmlFor="filter-type">Employment Type</label>
              <select
                id="filter-type"
                name="employmentType"
                value={filters.employmentType}
                onChange={handleFilterChange}
              >
                <option value="">All Employment Types</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="REMOTE">Remote</option>
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Search Jobs
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResetFilters}
              disabled={loading}
            >
              Reset
            </button>
            <span className="results-counter">
              {!loading && `${totalElements} ${totalElements === 1 ? 'job' : 'jobs'} available`}
            </span>
          </div>
        </form>
      </section>

      {/* Main Listing Content */}
      <section className="jobs-list-section">
        {loading && (
          <div className="loading-state" role="status">
            <div className="spinner"></div>
            <p>Fetching available positions...</p>
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-error error-state" role="alert">
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>Error loading jobs:</strong> {error}
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fetchJobs(page)}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <h3>No Jobs Found</h3>
            <p>
              We couldn't find any positions matching your search criteria. Try modifying your filters or checking back soon.
            </p>
            {(filters.title || filters.location || filters.category || filters.employmentType) && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleResetFilters}
                style={{ marginTop: '1rem' }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {!loading && !error && jobs.length > 0 && (
          <>
            <div className="jobs-grid">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} onSelect={setSelectedJob} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav className="pagination-bar" aria-label="Job pages">
                <button
                  type="button"
                  className="btn btn-secondary pagination-btn"
                  onClick={() => fetchJobs(page - 1)}
                  disabled={page === 0}
                >
                  &larr; Previous
                </button>
                <span className="page-indicator">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary pagination-btn"
                  onClick={() => fetchJobs(page + 1)}
                  disabled={page >= totalPages - 1}
                >
                  Next &rarr;
                </button>
              </nav>
            )}
          </>
        )}
      </section>

      {/* Selected Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          currentUser={currentUser}
          onClose={() => setSelectedJob(null)}
          onNavigateToLogin={onNavigateToLogin}
        />
      )}
    </div>
  );
}
