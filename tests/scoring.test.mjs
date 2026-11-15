import { scoreAt, schemeFor } from '../src/faces.js';
const cases = [['wa10',.03,'X'],['wa10',.08,10],['wa10',.15,9],['wa10',.95,1],['wa10',1.02,'M'],
 ['wa10c',.03,10],['wa10c',.08,9],['wa10c',.15,9],['wa10c',.25,8],['wa10c',.95,1],
 ['spot',.05,'X'],['spot',.15,10],['spot',.3,9],['spot',.9,6],['spotc',.05,10],['spotc',.15,9],['spotc',.3,9],['spotc',.5,8],['spotc',.9,6],
 ['wafield',.05,'X'],['wafield',.2,5],['wafield',.9,1],['ifaa',.05,'X'],['ifaa',.3,5],['ifaa',.5,4],['ifaa',.9,3]];
let bad=0; for (const [s,r,want] of cases){ const got=scoreAt(s,r); if (got!==want){bad++; console.log('FAIL',s,r,'want',want,'got',got);} }
console.log(bad? bad+' failures':'all '+cases.length+' scoring cases pass', '| compound wa10 ->', schemeFor('wa10','compound'), '| compound field ->', schemeFor('wafield','compound'));
