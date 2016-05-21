/**
 * A module to isolate all centrally used constants
 * @module AppConstants
 */
define([], function() {
  return {
    /**
     * the directory where the data resides
     * @member
     */
    DATA_DIR: "data",
    /**
     * the file where the different battery scenarios are stored
     * @member
     */
    SCENARIOS_FILE: "scenarios.json",
    /**
     * the special scenario file which contains the explanatory visualization
     * @member
     */
    SUMMARY_FILE: "summary.json",
    /**
     * the stories file related to that scenario
     * @member 
     */
    SUMMARY_STORIES_FILE: "summary-stories.json"
  };
});
