# CMO AI Analytics Dashboard System Rules

## Core Rules & CMO AI Data Intelligence Platform Specifications

### 1. Multi-Dataset Ingestion & Automatic Report Classification
- **Supported Formats**: Excel (.xlsx, .xls), CSV, Google Sheets, GA4 exports, JSON, and API streams.
- **Automatic Report Types**:
  - **REPORT A (Lead / Presales Lead Report)**: Detects fields like Enquiry Source, Presales Rating, Presales Agent, Lead Created Date, Campaign, etc. Represents the top-of-funnel Lead Generation stage.
  - **REPORT B (Push Report)**: Detects fields like Assign to Sales Manager, Assign to Sales On Date, Push Date, Sales Manager, etc. Represents the Presales → Sales handover/push funnel stage.
  - **REPORT C (Visit / VDNB Report)**: Detects fields like Date Of Site Visit, Site Visit Detail, Walk-in Source, Revisit, HO visit, Virtual visit, etc. Represents Site Visit / VDNB stage.
  - **REPORT D (Revenue / Booking Report)**: Detects fields like Booking Amount, Unit Value, Collection, Revenue, Booking Date, etc. Activates revenue/financial KPIs.
  - **REPORT E (GA4 / Marketing Expense Report)**: Detects fields like Sessions, Users, Engaged Sessions, Spend, CPL, ROAS, UTM Parameters, Landing Pages. Represents marketing acquisition and attribution.

### 2. Semantic Header Mapping & Standard CMO Data Model
- **Semantic Field Mapping**: Never depend on exact column names. Map varied headers (e.g. `Project`, `Project Name`, `Opportunity: Project` → `project_name`; `Enquiry Source`, `Source`, `UTM Source` → `enquiry_source`).
- **Standard Data Model**: Internally normalize all raw datasets into standard fields across Identification (`lead_id`, `opportunity_id`, `account_id`, `project_name`), Lead Info (`enquiry_source`, `campaign`, `utm_*`), Presales (`presales_agent`, `presales_status`), Push (`push_date`, `sales_manager`), Visit (`site_visit_done`, `site_visit_date`, `visit_type`), Sales (`sales_stage`, `booking_date`, `revenue`), and Geography (`zone`, `location`).
- **Full Traceability**: Maintain original raw records, source files, sheets, and mapped fields without overwriting raw source data.

### 3. Join Keys & Cross-File Lead Matching
- **Join Key Hierarchy**: Join multi-report records using:
  1. `Opportunity 18 digit ID`
  2. `OPID`
  3. `Account ID`
  4. Secondary fallback: `Customer Name` + `Project` + `Created Date`
- **Single Customer Lifecycle**: A single customer appearing in Lead Report + Push Report + Visit Report represents **1 Lead** traversing lifecycle states (`Lead Created → Pushed to Sales → Site Visit → Booking`), NOT 3 separate leads.

### 4. Default Funnel Discipline & Metric Isolation
- **Default Funnel Isolation**: Default status and funnel reports display ONLY:
  `Lead Created → Pushed to Sales → Site Visit → Conversion/Revenue`
- **Financial Metric Isolation**: Revenue metrics, booking monetary values, spend, and ROI must remain strictly isolated and NOT mixed into lead status count cards unless the user explicitly requests revenue, financial, CAC, or ROI analysis.
- **Never Invent Missing Data**: If revenue, GA4, or spend data is not present in the uploaded files, state that clearly (e.g. *"Revenue data is not available in currently uploaded reports"*). Never fabricate missing numbers.

### 5. Multi-Dimensional Analysis & Global Filters
- **Dimensions**: Dynamic filtering by Daily, Weekly, Monthly, Quarterly, Yearly, Custom Date Range, Source, Project, Campaign, Sales Manager, Presales Agent, Zone, and Lead Stage.
- **Dynamic Calculation**: All KPIs, charts, tables, and insights must be calculated dynamically from uploaded/validated datasets.

### 6. Data Quality, Duplicate Protection & Audit
- **Duplicate Protection**: Automatically detect duplicate files or records using Opportunity ID / OPID / Lead ID. Support Replace, Append (deduplicated), or Update options.
- **Data Quality Panel**: Track Mapped Records, Unmatched Records, Missing IDs/Dates/Sources, Duplicate Records, and Data Quality Score (%).

### 7. AI CMO Advisor Natural Language Responses
- **Query Resolution**: Dynamically filter and aggregate across normalized records according to user prompt context.
- **Structured Response Format**:
  1. **ANSWER**: Concise executive summary.
  2. **KPI**: Key performance metrics & metrics table.
  3. **BREAKDOWN**: Source / Project / Campaign / Manager tables and charts.
  4. **INSIGHT**: Analytical explanation of why metrics moved.
  5. **ACTION**: Actionable strategic recommendations based on data.

