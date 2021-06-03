# hint 1.37.0

* User can create a new project when enter key event is pressed

# hint 1.36.1

* Correctly scope ADR mutations/actions in upload logic

# hint 1.36.0

* Update Project and Version Repository and controllers to implement notes column

# hint 1.35.0

* Roll-back making login email case insensitive (mrc-2210)

# hint 1.34.0

* Clear ADR upload success message where necessary

# hint 1.33.1

* Revert to master branch of hintr

# hint 1.33.0

* Include metadata when pushing file to ADR

# hint 1.32.0

* Avoid re-uploading unchanged files to ADR

# hint 1.31.1

* Rebuild ADR uploadFiles with new resourceIds after upload new files

# hint 1.31.0

* Add accessibility statement

# hint 1.30.0

* Prevent ADR upload of output files from overwriting those from other projects

# hint 1.29.2

* Remove incorrectly committed debug code

# hint 1.29.1

* Improve performance of ADR uploads

# hint 1.29.0

* Progress feedback on uploading files to ADR

# hint 1.28.0

* Check and display user permissions on dataset when dataset is first selected

# hint 1.27.0

* Invoke ADR uploads with actions

# hint 1.26.0

* Set resource_type when pushing to ADR

# hint 1.25.0

* add upload button and dialog box for result outputs to ADR

# hint 1.24.0

* Make login email case insensitive

# hint 1.23.0

* Improved handling of ADR timeouts

# hint 1.22.0

* Check if user has ADR upload permission

# hint 1.21.0

* Backend support for ADR uploads

# hint 1.20.0

* Add output adr schemas

# hint 1.19.0

* validate Survey & Program file on change Baseline file

# hint 1.18.0

* add uncertainty ranges to choropleth tooltips

# hint 1.16.1

* Bug fix: Emails should be case insensitive when sharing a project

# hint 1.16.0

* show project name as default input value when a user clicks rename and copy project link

# hint 1.15.3

* Bug fix: Calibration error not returned to user

# hint 1.15.2

* Update help document to new provided by UNAIDS on 02/02/2021

# hint 1.15.1

* fix download of wrong results set

# hint 1.15.0

* add custom event to open confirmation modal

# hint 1.14.0

* Show indication that a project was shared by someone else underneath project name column

# hint 1.13.2

* Update translations using reviewed strings from UNAIDS

# hint 1.13.1

* Translate 'Select...' in form drop downs and 'required' warning

# hint 1.13.0

* Add indication that a project was shared by someone else

# hint 1.12.3

* prevent users from sharing projects with self or sharing with the same email twice


# hint 1.12.2

* Fix casing in French translation of "Spectrum file" 

# hint 1.12.1

* fix reload project post-calibrate

# hint 1.12.0

* adds a map reset button

# hint 1.11.0

* Do model calibration asynchronously.

# hint 1.10.3

* More useful "No data" message on map

# hint 1.10.2

* fix issues with plot legend wrapping

# hint 1.10.1

* Trigger confirm save dialog if subsequent steps have any changes

# hint 1.10.0

* fix ok button accessibility bug in share project

# hint 1.9.0

* make projects endpoint redirect session to login for non-logged in user

# hint 1.8.2

* Update help document

# hint 1.8.1

* bug fix for not been able to recover model run when hintr is torn down

# hint 1.8.1

* fix bug cancel button on share project dialog is broken

* fix cancel button not getting triggered at first when text input has data

# hint 1.8.0

* redirect stale session to login page with session error message


# hint 1.7.2

* Avoid opening links with javascript

# hint 1.7.1

* Update help document resource

# hint 1.7.0

* Update link text & resources

# hint 1.6.3

* Fix bug from `/model/options` which results in hanging spinner


# hint 1.6.2

* Auto advance to next step when run model completes

# hint 1.6.1

* Makes ADR import button red

# hint 1.6.0

* Show spinner when fetching ADR datasets

# hint 1.5.1

* Swap button colours on Save new version confirmation dialog

# hint 1.5.0

* Make 'Download results' step red when advance to that step.

# hint 1.4.0

* Include metadata default scale for bubble size

# hint 1.3.0

* Don't show ADR key to user after it has been entered.

# hint 1.2.1

* Fetch all relevant datasets from ADR without paging

# hint 1.2.0

* Support custom value ranges for bubble plot scales.

# hint 1.1.3

* Display text on map when no data in selections.

# hint 1.1.2

* Fixed bug where bubble plot failed to display bubble for single-value range.

* Fix bug to allow removal of files with errors

# hint 1.1.1
* Fixed bug where bubble plot failed to display bubble for single-value range.

# hint 1.1.0

* Bubble plot size can be scaled by filtered dataset


# hint 1.0.0

* ADR integration
* Table views of input and output data
* Project and version management
* Separation of calibration from model fitting
* Summary reports

# hint 0.0.0

* Initial version of HINT for 2019 workshops. 
