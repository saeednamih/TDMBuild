angular.module('TDM-FE')


    .factory('ExcelService', function () {


        var generalInfoStructure = [
            {
                name: "Task Name",
                field: "task_name",
                task_type: "all"
            },
            {
                name: "Task ID",
                field: "task_id",
                task_type: "all"
            },
            {
                name: "Task Execution ID",
                field: "task_execution_id",
                task_type: "all"
            },
            {
                name: "Created by",
                field: "created_by",
                task_type: "all"
            },
            {
                name: "Executed By",
                field: "executed_by",
                task_type: "all"
            },
            {
                name: "Execution Time (UTC)",
                field: "start_execution",
                task_type: "all"
            },
            {
                name: "Execution Status", // missing
                field: "execution_status",
                task_type: "all"
            },
            {
                name: "Source Environment",
                field: "source_env",
                task_type: "all"
            },
            {
                name: "Target Environment",
                field: "target_env",
                task_type: "load"
            },
            {
                name: "Business Entity Name",
                field: "be_name",
                task_type: "all"
            },
            {
                name: "",
                field: "",
                task_type: "all"
            },
            {
                name: "Task Properties:",
                field: "",
                task_type: "all"
            },
            {
                name: "Task Type:",
                field: "task_type",
                task_type: "all"
            },
            {
                name: "Selection Method:",
                field: "selection_method",
                task_type: "load"
            },
            {
                name: "Sync Mode:",
                field: "sync_mode",
                task_type: "load"
            },
            {
                name: "Operation Mode:",
                field: "operation_mode",
                task_type: "load"
            },
            {
                name: "Replace Sequences:",
                field: "replace_sequences",
                task_type: "load"
            },
            {
                name: "Task Versioning:",
                field: "version_ind",
                task_type: "all"
            },
            {
                name: "Selected Version Name for Entities:",
                field: "selected_version_task_name",
                task_type: "load"
            },
            {
                name: "Selected Version Datetime for Entities:",
                field: "selected_version_datetime",
                task_type: "load"
            },
            {
                name: "Selected Version Name for Reference Tables:",
                field: "selected_ref_version_task_name",
                task_type: "load"
            },
            {
                name: "Selected Version Datetime for Reference Tables:",
                field: "selected_ref_version_datetime",
                task_type: "load"
            },
            {
                name: "Scheduling Parameters:",
                field: "version_ind",
                task_type: "load"
            },
            {
                name: "Schedule Expiration Date:",
                field: "schedule_expiration_date",
                task_type: "load"
            },
            {
                name: "Version Expiration Date:",
                field: "version_expiration_date",
                task_type: "extract"
            },
            {
                name: "Retention Period Type:",
                field: "retention_period_type",
                task_type: "extract"
            },
            {
                name: "Retention Period Value:",
                field: "retention_period_value",
                task_type: "extract"
            }
        ];
        var generalInfo = {};
        
        var setGeneralInfo = function (info) {
            generalInfo = info;
        };
        
        var buildGeneralInfoTab = function (worksheet) {
            var task_type = generalInfo.task_type;
            generalInfoStructure.forEach(function (field) {
                var value = generalInfo[field.field] || '';
                if (field.task_type === 'all' ||
                    field.task_type === task_type.toLowerCase()) {
                    worksheet.addRow([field.name, '' + value]);
                }
            });
        };
        
        var addEmptyLine = function (worksheet) {
            worksheet.addRow(['']);
        };
        
        /**
         * @param data - Array of entries to build the table
         * @param worksheet
         * @returns {{ref: *, columns: [], style: {showFirstColumn: boolean, theme: string}, rows: []}} - Table Model
         */
        var getTableModel = function (data, worksheet, tableName) {
            if (!data || !data.length) {
                return {};
            }
        
            var tableCols = [];
            var tableRows = [];
        
            // reference to next line to indicate the current cell name in order to pass it for the table model as a ref
            var currentRow = worksheet.addRow(['']);
        
            var getColumnStyle = function () {
                return {
                    font: {bold: true},
                    border: {
                        top: {style: 'medium'},
                        left: {style: 'medium'},
                        bottom: {style: 'medium'},
                        right: {style: 'medium'}
                    }
                }
            };
        
            // generate columns based on first data entry keys names
            Object.keys(data[0]).forEach(function (key) {
                tableCols.push({name: key, key: key, width: '77'});
            });
            //generate rows based on entries
            for (var i = 0; i < data.length; i++) {
                var tableRow = [];
                var row = data[i];
                Object.keys(row).forEach(function (key) {
                    tableRow.push(row[key])
                });
                tableRows.push(tableRow);
            }
        
            return {
                name: tableName,
                ref: currentRow._cells[0]._address,
                columns: tableCols,
                rows: tableRows,
                style: {}
            };
        
        };
        
        var addCustomizedRow = function (text, worksheet, customStyle) {
            var row = worksheet.addRow([text]);
            Object.keys(customStyle).forEach(function (styleAttr) {
                row[styleAttr] = customStyle[styleAttr];
            });
        };
        
        var addWorksheetNote = function (note, worksheet) {
            var customStyle = {
                font: {
                    color: {argb: 'FF8C00'}
                }
            };
            addCustomizedRow(note, worksheet, customStyle)
        };
        
        var addWorksheetTitle = function (titleName, worksheet) {
            var customStyle = {
                font: {
                    bold: true,
                    size: 14
                }
            };
            addCustomizedRow(titleName, worksheet, customStyle);
        };
        
        var addWorksheetWarning = function (message, worksheet) {
            var customStyle = {
                font: {
                    bold: true,
                    color: {argb: 'FF0000'}
                }
            };
            addCustomizedRow(message, worksheet, customStyle);
        };
        
        var buildLoadTaskExecutionSummary = function (worksheet, tabData) {
        
            if (!tabData || !tabData.length) {
                addEmptyLine(worksheet);
                return;
            }
            const tableData = getTableModel(tabData, worksheet, 'loadExecutionSummary');
            if (tableData && tableData.columns) {
                tableData.columns.forEach(column => {
                    if (column.name === 'start_execution_time') {
                        column.name = 'start_execution_time (UTC)';
                    }
                    else if (column.name === 'end_execution_time') {
                        column.name = 'end_execution_time (UTC)';
                    }
                });
            }
            worksheet.addTable(tableData);
            addEmptyLine(worksheet);
        };
        
        var buildExtractTaskExecutionSummary = function (worksheet, tabData) {
            var migrateTableData = [];
            var referenceTableData = [];
        
            //generate migrate table data and attach lu name to rows, and missing 3 fields from the fabric (as discussed)
            for (var i = 0; i < tabData.length; i++) {
                var luData = tabData[i];
                var luName = luData['LU Name'];
                if (luData['LU Migration Summary']) {
                    migrateTableData = migrateTableData.concat(luData['LU Migration Summary'].map(function (data) {
                        data = Object.assign({'LU Name': luName}, data);
                        // as discussed with Taha, currently, we will add these 3 missing fields for rows which has no migration because the fabric does not return them.
                        data.added = data.added || 0;
                        data.updated = data.updated || 0;
                        data.unchanged = data.unchanged || 0;
                        return data;
                    }));
                }
                referenceTableData = referenceTableData.concat(luData['LU Reference Summary']);
            }
        
            var addMigrateTable = function (migrateData, worksheet) {
                addWorksheetTitle('Migrating summary report for Task Execution ID: ' + generalInfo.task_execution_id, worksheet);
                addEmptyLine(worksheet);
        
                if (!migrateData || !migrateData.length) {
                    addWorksheetWarning('No entities were migrated', worksheet);
                    return;
                }
                var table = getTableModel(migrateData, worksheet, 'migrateTable');
        
                if (table.columns && table.columns.length) {
                    // customize table to add logical unit name as the first column;
                    // push lu name as first column
                    for (var i = 0; i < table.rows[0]; i++) {
                        table.rows[0][i].unshift(luName);
                    }
                    table.columns.forEach(column => {
                        if (column.name === 'start time') {
                            column.name = 'start time (UTC)';
                        }
                        else if (column.name === 'end time') {
                            column.name = 'end time (UTC)';
                        }
                    });
                }
        
                worksheet.addTable(table);
                addEmptyLine(worksheet);
        
            };
        
            var addReferenceTable = function (refData, worksheet) {
                addWorksheetTitle('Execution Summary Report for Reference Tables', worksheet);
                addEmptyLine(worksheet);
        
                if (!refData || !refData.length) {
                    addWorksheetWarning('No Reference Tables', worksheet);
                    return;
                }
                const tableData = getTableModel(refData, worksheet, 'referenceTableSummary');
                if (tableData && tableData.columns) {
                    tableData.columns.forEach(column => {
                        if (column.name === 'end_time') {
                            column.name = 'end_time (UTC)';
                        }
                        else if (column.name === 'start_time') {
                            column.name = 'start_time (UTC)';
                        }
                    });
                }

                worksheet.addTable(tableData);

                addEmptyLine(worksheet);
        
            };
        
            addMigrateTable(migrateTableData, worksheet);
        
            addEmptyLine(worksheet);
        
            addReferenceTable(referenceTableData, worksheet);
        
        };
        
        var buildListOfRootEntitiesTab = function (worksheet, tabData) {
            var numOfCopiedEntities = tabData['Number of Copied Entities'][0].number_of_copied_root_entities;
            var listOfCopiedEntities = tabData['List of Copied Entities'];
            var numOfFailedEntities = tabData['Number of Failed Entities'][0].number_of_failed_root_entities;
            var listOfFailedEntities = tabData['List of Failed Entities'];
        
            var addCopiedEntitiesTable = function (numOfCopiedEntities, listOfCopiedEntities) {
                addWorksheetTitle('Number of ' + generalInfo.be_name + ' Copied entities:' + numOfCopiedEntities, worksheet);
                addEmptyLine(worksheet);
        
                if (numOfCopiedEntities > 0) {
                    worksheet.addTable(getTableModel(listOfCopiedEntities, worksheet, 'copiedEntitiesTable'));
                    addEmptyLine(worksheet);
                }
        
            };
        
            var addFailedEntitiesTable = function (numOfFailedEntities, listOfFailedEntities) {
                addWorksheetTitle('Number of ' + generalInfo.be_name + ' Failed entities:' + numOfFailedEntities, worksheet);
                addEmptyLine(worksheet);
        
                if (numOfFailedEntities > 0) {
                    worksheet.addTable(getTableModel(listOfFailedEntities, worksheet, 'failedEntitiesTable'));
                    addEmptyLine(worksheet);
                }
            };
        
            addCopiedEntitiesTable(numOfCopiedEntities, listOfCopiedEntities);
            addFailedEntitiesTable(numOfFailedEntities, listOfFailedEntities);
        
            // addWorksheetNote('Note- the list of the copied/failed entities will not be limited by the array size', worksheet);
            addEmptyLine(worksheet);
        };
        
        var buildListOfReferenceTables = function (worksheet, tabData) {
            var numOfCopiedEntities = tabData['Number of Copied Reference Tables'][0].count;
            var listOfCopiedEntities = tabData['List of Copied Reference Tables'];
            var numOfFailedEntities = tabData['Number of Failed Reference Tables'][0].count;
            var listOfFailedEntities = tabData['List of Failed Reference Tables'];
        
            var addCopiedRefTable = function (numOfCopiedEntities, listOfCopiedEntities) {
                addWorksheetTitle('Number of ' + generalInfo.be_name + ' Copied Reference Tables: ' + numOfCopiedEntities, worksheet);
                addEmptyLine(worksheet);
        
                if (numOfCopiedEntities > 0) {
                    worksheet.addTable(getTableModel(listOfCopiedEntities, worksheet, 'copiedRefTable'));
                    addEmptyLine(worksheet);
                }
        
            };
        
            var addFailedRefTable = function (numOfFailedEntities, listOfFailedEntities) {
                addWorksheetTitle('Number of ' + generalInfo.be_name + ' Failed Reference Tables: ' + numOfFailedEntities, worksheet);
                addEmptyLine(worksheet);
        
                if (numOfFailedEntities > 0) {
                    worksheet.addTable(getTableModel(listOfFailedEntities, worksheet, 'failedRefTable'));
                    addEmptyLine(worksheet);
                }
            };
        
            addCopiedRefTable(numOfCopiedEntities, listOfCopiedEntities);
            addFailedRefTable(numOfFailedEntities, listOfFailedEntities);
        };
        
        var buildErrorSummaryTab = function (worksheet, tabData) {
            var i=0;
        
            Object.keys(tabData).forEach(function (tableTitle) {
                var tableData = tabData[tableTitle];
                i++;
                if (tableData && tableData.length) {
                    addWorksheetTitle(tableTitle, worksheet);
                    addEmptyLine(worksheet);
                    worksheet.addTable(getTableModel(tableData, worksheet, 'errorSummary' + i));
                    addEmptyLine(worksheet);
                }
            })
        };
        
        var buildStatisticsReportTab = function (worksheet, tabData) {
        
            if (!tabData || !tabData.length) {
                addWorksheetWarning('No Statistics Report Data', worksheet);
                return;
            }
            worksheet.addTable(getTableModel(tabData, worksheet, 'statisticsReportTable'));
            addEmptyLine(worksheet);
        };
        
        var buildSequenceSummaryTab = function (worksheet, tabData) {
            if (!tabData || !tabData.length) {
                addWorksheetWarning('No Sequence Summary Report Data', worksheet);
                return;
            }
            worksheet.addTable(getTableModel(tabData, worksheet, 'sequenceSummaryTable'));
            addEmptyLine(worksheet);
        
        };

        var buildErrorDetailsTab = function (worksheet, tabData) {
            if (!tabData || !tabData.length) {
                addWorksheetWarning('No Error Details Report Data', worksheet);
                return;
            }
            worksheet.addTable(getTableModel(tabData, worksheet, 'errorDetailsTable'));
            addEmptyLine(worksheet);
        
        };

        var buildErrorSummaryTab = function (worksheet, tabData) {
            if (!tabData || !tabData.length) {
                addWorksheetWarning('No Error Summary Report Data', worksheet);
                return;
            }
            worksheet.addTable(getTableModel(tabData, worksheet, 'errorSummaryTable'));
            addEmptyLine(worksheet);
        };
        
        var buildExtractTab = function (tabName, tabData, worksheet) {
            switch (tabName) {
                case 'General Info':
                    buildGeneralInfoTab(worksheet);
                    break;
                case 'Task Execution Summary':
                    buildExtractTaskExecutionSummary(worksheet, tabData);
                    break;
                case 'List of Root Entities':
                    buildListOfRootEntitiesTab(worksheet, tabData);
                    break;
                case 'List of Reference Tables':
                    buildListOfReferenceTables(worksheet, tabData);
                    break;
                default:
            }
        };
        
        var buildLoadTab = function (tabName, tabData, worksheet) {
            switch (tabName) {
                case 'General Info':
                    buildGeneralInfoTab(worksheet);
                    break;
                case 'Task Execution Summary':
                    buildLoadTaskExecutionSummary(worksheet, tabData);
                    break;
                case 'List of Root Entities':
                    buildListOfRootEntitiesTab(worksheet, tabData);
                    break;
                case 'List of Reference Tables':
                    buildListOfReferenceTables(worksheet, tabData);
                    break;
                case 'Error Summary':
                    buildErrorSummaryTab(worksheet, tabData);
                    break;
                case 'Statistics Report':
                    buildStatisticsReportTab(worksheet, tabData);
                    break;
                case 'Replace Sequence Summary Report':
                    buildSequenceSummaryTab(worksheet, tabData);
                    break;
                case 'Error Details':
                    buildErrorDetailsTab(worksheet, tabData);
                    break;
                // case 'Error Summary':
                //     buildErrorSummaryTab(worksheet, tabData);
                //     break;
                default:
            }
        };

        let assignWorksheetColumnsWidth = worksheet => {
            if (!worksheet.columns) {
                return;
            }
            for (let i = 0; i < worksheet.columns.length; i += 1) {
                let dataMax = 0;
                const column = worksheet.columns[i];
                for (let j = 1; column.values[j] && j < column.values.length; j += 1) {
                    const columnLength = column.values[j].length;
                    if (columnLength > dataMax) {
                        dataMax = columnLength;
                    }
                }
                column.width = dataMax < 10 ? 20 : dataMax + 20;
            }
        };

        var buildExcel =  function (workbook, data) {
            var taskType = generalInfo.task_type.toLowerCase();
            Object.keys(data).forEach(function (tabName) {
                var worksheet = workbook.addWorksheet(tabName);
                var tabData = data[tabName];
                taskType === 'extract' ? buildExtractTab(tabName, tabData || {}, worksheet) : buildLoadTab(tabName, tabData || {}, worksheet);

                assignWorksheetColumnsWidth(worksheet);
            });
        
        };
        
        var buildSummaryExcel = function(data){
            var workbook = new ExcelJS.Workbook();

            setGeneralInfo(data['General Info'][0]);
            buildExcel(workbook, data);
            return workbook;
        };
        

        return {
            buildSummaryExcel : buildSummaryExcel,
        }
    })