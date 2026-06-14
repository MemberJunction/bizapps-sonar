/**********************************************************************************
* GENERATED FILE - This file is automatically managed by the MJ CodeGen tool, 
* 
* DO NOT MODIFY THIS FILE - any changes you make will be wiped out the next time the file is
* generated
* 
**********************************************************************************/
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// MemberJunction Imports
import { BaseFormsModule } from '@memberjunction/ng-base-forms';
import { EntityViewerModule } from '@memberjunction/ng-entity-viewer';
import { LinkDirectivesModule } from '@memberjunction/ng-link-directives';

// Import Generated Components
import { sonarFactorFormComponent } from "./Entities/sonarFactor/sonarfactor.form.component";
import { sonarModelFactorFormComponent } from "./Entities/sonarModelFactor/sonarmodelfactor.form.component";
import { sonarModelRelatedEntityFormComponent } from "./Entities/sonarModelRelatedEntity/sonarmodelrelatedentity.form.component";
import { sonarScoreBandSetFormComponent } from "./Entities/sonarScoreBandSet/sonarscorebandset.form.component";
import { sonarScoreBandTransitionFormComponent } from "./Entities/sonarScoreBandTransition/sonarscorebandtransition.form.component";
import { sonarScoreBandFormComponent } from "./Entities/sonarScoreBand/sonarscoreband.form.component";
import { sonarScoreFactorContributionFormComponent } from "./Entities/sonarScoreFactorContribution/sonarscorefactorcontribution.form.component";
import { sonarScoreHistoryFormComponent } from "./Entities/sonarScoreHistory/sonarscorehistory.form.component";
import { sonarScoreModelAuditEventFormComponent } from "./Entities/sonarScoreModelAuditEvent/sonarscoremodelauditevent.form.component";
import { sonarScoreModelVersionFormComponent } from "./Entities/sonarScoreModelVersion/sonarscoremodelversion.form.component";
import { sonarScoreModelFormComponent } from "./Entities/sonarScoreModel/sonarscoremodel.form.component";
import { sonarScoreRecomputeRunFormComponent } from "./Entities/sonarScoreRecomputeRun/sonarscorerecomputerun.form.component";
import { sonarScoreFormComponent } from "./Entities/sonarScore/sonarscore.form.component";
import { sonarTimeWindowFormComponent } from "./Entities/sonarTimeWindow/sonartimewindow.form.component";
   

@NgModule({
declarations: [
    sonarFactorFormComponent,
    sonarModelFactorFormComponent,
    sonarModelRelatedEntityFormComponent,
    sonarScoreBandSetFormComponent,
    sonarScoreBandTransitionFormComponent,
    sonarScoreBandFormComponent,
    sonarScoreFactorContributionFormComponent,
    sonarScoreHistoryFormComponent,
    sonarScoreModelAuditEventFormComponent,
    sonarScoreModelVersionFormComponent,
    sonarScoreModelFormComponent,
    sonarScoreRecomputeRunFormComponent,
    sonarScoreFormComponent,
    sonarTimeWindowFormComponent],
imports: [
    CommonModule,
    FormsModule,
    BaseFormsModule,
    EntityViewerModule,
    LinkDirectivesModule
],
exports: [
]
})
export class GeneratedForms_SubModule_0 { }
    


@NgModule({
declarations: [
],
imports: [
    GeneratedForms_SubModule_0
]
})
export class GeneratedFormsModule { }
    
// Note: LoadXXXGeneratedForms() functions have been removed. Tree-shaking prevention
// is now handled by the pre-built class registration manifest system.
// See packages/CodeGenLib/CLASS_MANIFEST_GUIDE.md for details.
    