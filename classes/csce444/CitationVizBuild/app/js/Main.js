/* global doc, UI */

var sharedKeywordSliders = new UI.PhysicSliders(doc.getElementById('shared-keyword-sliders'), 'Shared Keyword');

var yearFilterSlider = new UI.FilterSlider(doc.getElementById('year-filter'), 
                                           'Year', 
                                           [2010, 2011, 2013, 2015, 2016], 
                                           [1, 3, 2, 5, 1]
                                          );

var countFilterSlider = new UI.FilterSlider(doc.getElementById('citation-count-filter'), 
                                            'Citation Count', 
                                            [0, 1, 2, 3, 4, 5, 6, 7], 
                                            [56, 1, 22, 3, 4, 0, 1, 1]
                                           );