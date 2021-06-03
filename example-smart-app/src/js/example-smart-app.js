(function (window) {
    window.extractData = function () {
        var ret = $.Deferred();

        function onError() {
            console.log('Loading error', arguments);
            ret.reject();
        }

        function onReady(smart) {
            if (smart.hasOwnProperty('patient')) {
                var patient = smart.patient;
                var pt = patient.read();
                var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                        /*code: {
                            $or: [
                                'http://loinc.org|8302-2',
                                'http://loinc.org|8462-4',
                                'http://loinc.org|8480-6',
                                'http://loinc.org|2085-9',
                                'http://loinc.org|2089-1',
                                'http://loinc.org|55284-4'
                            ]
                        },*/
                        date: 'gt2021-01-01',
                        category: 'vital-signs'
                    }
                });
                var alg = smart.patient.api.fetchAll({
                    type: 'AllergyIntolerance',
                    query: {
                        status: 'active,confirmed,unconfirmed',
                        date: 'gt2021-01-01',
                        category: 'vital-signs'
                    }
                });

                console.log(patient);
                console.log(obv);
                console.log(alg);
                $.when(pt, obv).fail(onError);

                $.when(pt, obv, alg).done(function (patient, obv, allergies) {
                    var byCodes = smart.byCodes(obv, 'code');
                    var gender = patient.gender;

                    var fname = '';
                    var lname = '';

                    if (typeof patient.name[0] !== 'undefined') {
                        fname = patient.name[0].given.join(' ');
                        lname = patient.name[0].family.join(' ');
                    }

                    var height = byCodes('8302-2');
                    var systolicbp = getBloodPressureValue(
                        byCodes('55284-4'),
                        '8480-6'
                    );
                    var diastolicbp = getBloodPressureValue(
                        byCodes('55284-4'),
                        '8462-4'
                    );
                    var hdl = byCodes('2085-9');
                    var ldl = byCodes('2089-1');
                    var allergyTable = '<table>';
                    var allergyLen = allergies.length;
                    if (allergyLen === 0) {
                        allergyTable += '<tr><td>No Allergies Found</td></tr>';
                    }
                    for (var i = 0; i < allergyLen; i++) {
                        if (allergies[i].reaction !== null) {
                            alert(alleregies[i].substance.text);
                        }
                        allergyTable +=
                            '<tr><td>' +
                            allergies[i].substance.text +
                            '</td></tr>';
                    }
                    allergyTable += '</table>';
                    var p = defaultPatient();
                    p.birthdate = patient.birthDate;
                    p.gender = gender;
                    p.fname = fname;
                    p.lname = lname;
                    p.height = getQuantityValueAndUnit(height[0]);

                    if (typeof systolicbp != 'undefined') {
                        p.systolicbp = systolicbp;
                    }

                    if (typeof diastolicbp != 'undefined') {
                        p.diastolicbp = diastolicbp;
                    }

                    p.hdl = getQuantityValueAndUnit(hdl[0]);
                    p.ldl = getQuantityValueAndUnit(ldl[0]);
                    p.allergies = allergyTable;

                    ret.resolve(p);
                });
            } else {
                onError();
            }
        }

        FHIR.oauth2.ready(onReady, onError);
        return ret.promise();
    };

    function defaultPatient() {
        return {
            fname: { value: '' },
            lname: { value: '' },
            gender: { value: '' },
            birthdate: { value: '' },
            height: { value: '' },
            systolicbp: { value: '' },
            diastolicbp: { value: '' },
            ldl: { value: '' },
            hdl: { value: '' },
            allergies: { value: '' }
        };
    }

    function getBloodPressureValue(BPObservations, typeOfPressure) {
        var formattedBPObservations = [];
        BPObservations.forEach(function (observation) {
            var BP = observation.component.find(function (component) {
                return component.code.coding.find(function (coding) {
                    return coding.code == typeOfPressure;
                });
            });
            if (BP) {
                observation.valueQuantity = BP.valueQuantity;
                formattedBPObservations.push(observation);
            }
        });

        return getQuantityValueAndUnit(formattedBPObservations[0]);
    }

    function getQuantityValueAndUnit(ob) {
        if (
            typeof ob != 'undefined' &&
            typeof ob.valueQuantity != 'undefined' &&
            typeof ob.valueQuantity.value != 'undefined' &&
            typeof ob.valueQuantity.unit != 'undefined'
        ) {
            return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
        } else {
            return undefined;
        }
    }

    window.drawVisualization = function (p) {
        $('#holder').show();
        $('#loading').hide();
        $('#fname').html(p.fname);
        $('#lname').html(p.lname);
        $('#gender').html(p.gender);
        $('#birthdate').html(p.birthdate);
        $('#height').html(p.height);
        $('#systolicbp').html(p.systolicbp);
        $('#diastolicbp').html(p.diastolicbp);
        $('#ldl').html(p.ldl);
        $('#hdl').html(p.hdl);
        $('#allergyIntolerance').html(p.allergies);
    };
})(window);
