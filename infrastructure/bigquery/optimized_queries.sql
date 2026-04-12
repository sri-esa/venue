-- F3: BigQuery Partition Pruning Optimization
-- To reduce costs and scanning times, all analytics queries must bound by partitioning.
SELECT zoneId, MAX(occupancy) as max_occupancy
FROM `smart-venue-dev.venue_analytics.crowd_density_log`
WHERE DATE(recorded_at) = CURRENT_DATE() -- Partition Pruning 
  AND venueId = 'venue_1'
GROUP BY zoneId;
