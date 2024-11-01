import React, { useState, useEffect } from 'react';
import './App.css';
import { Divider, AppBar, Checkbox, ListItemText, Toolbar,TextField, Select, MenuItem, Button, Container, Box, Tabs, Tab, Typography, LinearProgress , Collapse, } from '@mui/material';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation, useParams} from 'react-router-dom';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid'; 
import ResultsPage from './results'; // Updated to ResultsPage for clarity


function App() {
  const { sessionID } = useParams();
  const socket = io('http://localhost:3001');
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState(location.state?.searchTerm || ''); // State for search term
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0); // State for tracking progress
  const [selectedDataset, setSelectedDataset] = useState([]); 
  const [selectedType, setSelectedType] = useState([]);
  const [selectedStud, setSelectedStud] = useState([]);
  const [availableDatasets, setAvailableDatasets] = useState([
    'Breast lobular',
    'Breast – IDC',
    'Breast – HER2',
    'Breast – ER+',
    'Breast – TNBC',
    'Breast – DCIS',
    'Ovarian',
    'Endometrial',
    'Prostate',
    'Kidney – renal cell',
    'Liver',
    'Colorectal',
    'Pancreatic - IPMN',
    'Pancreatic – PDAC',
    'Gastrointestinal – GIST',
    'Lung – squamous',
    'Lung – adenocarcinoma',
    'Head and neck',
    'Breast – lymph node mets',
    'Colorectal – liver mets',
    'Brain – glioblastoma',
    'Brain – NF1 neurofibroma',
    'Brain – medulloblastoma',
    'Oral squamous cell',
    'Cutaneous squamous cell',
    'Lung – brain mets',
    'Breast – brain mets',
    'Melanoma – brain mets',
    'Basal cell',
    'Adenoid cystic',
    'Cervical',
    'Ependymoma',
    'Melanoma',
    'Lymphoma',
  ]);
  const navigate = useNavigate();
  const [query1, setQuery1] = useState(''); // State for query 1 in tab 2
  const [query2, setQuery2] = useState(''); // State for query 2 in tab 2
  const [activeTab, setActiveTab] = useState(0); // State to control tabs
  const [advancedSettingsVisible, setAdvancedSettingsVisible] = useState(false); 



  useEffect(() => {
    if (!sessionID) {
      const newSessionID = crypto.randomUUID(); // Generate a unique UUID for the sessionID
      navigate(`/${newSessionID}`, { replace: true }); // Redirect to URL with the new sessionID
    }
    console.log('Generated or retrieved sessionID:', sessionID);

    }, [navigate, sessionID]);


  useEffect(() => {
    
    setAvailableDatasets([
      'Breast lobular',
      'Breast – IDC',
      'Breast – HER2',
      'Breast – ER+',
      'Breast – TNBC',
      'Breast – DCIS',
      'Ovarian',
      'Endometrial',
      'Prostate',
      'Kidney – renal cell',
      'Liver',
      'Colorectal',
      'Pancreatic - IPMN',
      'Pancreatic – PDAC',
      'Gastrointestinal – GIST',
      'Lung – squamous',
      'Lung – adenocarcinoma',
      'Head and neck',
      'Breast – lymph node mets',
      'Colorectal – liver mets',
      'Brain – glioblastoma',
      'Brain – NF1 neurofibroma',
      'Brain – medulloblastoma',
      'Oral squamous cell',
      'Cutaneous squamous cell',
      'Lung – brain mets',
      'Breast – brain mets',
      'Melanoma – brain mets',
      'Basal cell',
      'Adenoid cystic',
      'Cervical',
      'Ependymoma',
      'Melanoma',
      'Lymphoma',
    ]);
  
    socket.on('progress', (data) => {
      setProgress(Math.max(5,data.progress));   
    });

    return () => {
      socket.disconnect();
    };


  }, []);


  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setIsLoading(true);
    setProgress(5); // Reset progress at the start


    const data = {
      searchTerm: activeTab === 1 ? searchTerm.trim() : `${query1} ${query2}`.trim(), // Use combined queries for tab 2 
      selectedDatasets: selectedDataset ,
      sessionID
    };



    axios.post('http://localhost:3001/search', data)
      .then(response => {
        if (response.data.message === 'Processing complete') {
          setIsLoading(false);
          navigate(`/results/${sessionID}`, { state: { searchTerm: searchTerm.trim() } });
        }
      })
      .catch(error => {
        console.error('Error:', error);
        setIsLoading(false);
      });
  };



  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };


  const handleAdvancedSettingsToggle = () => {
    setAdvancedSettingsVisible(!advancedSettingsVisible); // Toggle visibility of advanced settings
  };

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img src="/logoo.png" alt="Baylor Logo" style={{ height: '50px', marginLeft: '2px' }} />
          </Box>
        </Toolbar>
      </AppBar>
      <Container>

          <Box sx={{  }}>
            {isLoading && (
              <Box sx={{ width: '100%', mt: 2, position: 'relative' }}>
              {/* Thicker progress bar */}
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: '10px' }}  // Thickness of the progress bar
              />
              {/* Display progress percentage */}
              <Typography 
                variant="body2" 
                color="textSecondary" 
                sx={{ 
                  position: 'absolute', 
                  right: 0, 
                  top: '-5px',  // Adjust vertical positioning of the percentage
                  transform: 'translateX(100%)'  // Move the percentage label to the right end of the progress bar
                }}
              >
                {`${Math.round(progress)}%`}
              </Typography>
              </Box>
            )}
            
          </Box>

                  {/* Tab Navigation */}
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="Search options">
          <Tab label="Option 1" />
          <Tab label="Option 2" />
        </Tabs>

        {/* Tab Panel 1: Single Search Bar */}
        {activeTab === 1 && (
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', alignItems: 'center', mt: 2 , width:'75%'}}>
            <Typography variant="body2" sx={{ mr: 2 , textAlign:'left'}}>Enter a Query, gene or gene-set to test spatial co-localization:</Typography>
            <TextField
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              
              variant="outlined"
              size="small"
              sx={{ backgroundColor: 'white', borderRadius: 2 }}
            />
            <Button type="submit" variant="contained" color="primary" sx={{ ml: 2 }} disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Search'}
            </Button>
          </Box>
        )}

        {/* Tab Panel 2: Two Query Inputs in One Row */}
        {activeTab === 0 && (
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'left', mt: 2 }}>
            <Typography variant="body2" sx={{ mr: 2 , mt:2}}>Enter Query, a Cell-Cell Interaction:</Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '20%' }}>
              <Typography variant="caption" fontSize={14} sx={{ mb: 0 }}>Cell Type 1 Markers</Typography>
              <TextField
                value={query1}
                onChange={(e) => setQuery1(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ backgroundColor: 'white', borderRadius: 2 }}
              />
            </Box>

            {/* Long Dash between the boxes, with no margin */}
            <Typography sx={{ fontSize: '1.5rem', mx: 1 }}>______</Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '20%' }}>
              <Typography variant="caption" fontSize={14}sx={{ mb: 0, }}>Cell Type 2 Markers</Typography>
              <TextField
                value={query2}
                onChange={(e) => setQuery2(e.target.value)}
              
                variant="outlined"
                size="small"
                sx={{ backgroundColor: 'white', borderRadius: 2 }}
              />
            </Box>

            {/* Search Button in the same row */}
            <Button type="submit" variant="contained" color="primary" sx={{ ml: 2 , mt:2}} disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Search'}
            </Button>
          </Box>
        )}



    {/* Second Row: Dropdown options */}
    <Typography
        variant="body2"
        sx={{ mt: 2, cursor: 'pointer', color: 'blue' }}
        onClick={handleAdvancedSettingsToggle}
      >
        {advancedSettingsVisible ? 'Advanced Settings' : 'Advanced Settings'}
      </Typography>

      {/* Collapse for Advanced Settings */}
      <Collapse in={advancedSettingsVisible}>
        {/* Second Row: Dropdown options */}


   <Box sx={{ display: 'flex', justifyContent: 'left', width: '80%', mt: 2, marginLeft: '200px' }}> {/* Reduced margin-top */}
  {/* Dataset Dropdown */}
  <Typography style={{ textAlign: 'center' }}>Refined Analysis:</Typography>
  <Box sx={{ width: '11%', mr: 3 , ml:1 }}>
    <Select
      multiple
      value={selectedDataset}
      onChange={async (e) => { // Marked as async
        const value = e.target.value;

        // Check if "All Datasets" is selected
        if (value.includes("All Datasets")) {
          if (!selectedDataset.includes("All Datasets")) {
            // Select all datasets when "All Datasets" is clicked
            setSelectedDataset(["All Datasets", ...availableDatasets]);
            await axios.post('http://localhost:3001/set_selected_datasets', {
              datasets: availableDatasets, // Send all datasets
            });
          } else {
            // Deselect all when "All Datasets" is unchecked
            setSelectedDataset([]);
            await axios.post('http://localhost:3001/set_selected_datasets', {
              datasets: [], // Send an empty array to indicate no datasets selected
            });
          }
        } else {
          // Handle normal dataset selection
          setSelectedDataset(value);
          await axios.post('http://localhost:3001/set_selected_datasets', {
            datasets: value.length > 0 ? value : [], // Handle empty array if all datasets are deselected
          });
        }
      }}
      renderValue={(selected) => {
        if (selected.length === 0) {
          return <em>Dataset</em>;  // Placeholder when nothing is selected
        } else if (selected.includes("All Datasets")) {
          return `All Datasets (${availableDatasets.length})`;  // Display "All Datasets"
        }
        return `Dataset (${selected.length})`;  // Show the count of selected datasets
      }}
      displayEmpty
      fullWidth
      sx={{ height: '30px', fontSize: '0.8rem', backgroundColor: 'white', borderRadius: 1 }}
      MenuProps={{
        PaperProps: {
          style: {
            maxWidth: 500,
            maxHeight: 500,
          },
        },
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'left',
        },
        transformOrigin: {
          vertical: 'top',
          horizontal: 'left',
        },
        getContentAnchorEl: null,
      }}
    >
      <MenuItem disabled value="">
        <em>Dataset</em>
      </MenuItem>

  

      {/* "All Datasets" Option */}
      <MenuItem key="All Datasets" value="All Datasets" sx={{ fontSize: '0.5rem', display: 'flex', alignItems: 'center' }}>
        <Checkbox
          checked={selectedDataset.includes("All Datasets")}
          onChange={async (e) => { // Marked as async
            if (e.target.checked) {
              // Select all datasets when "All Datasets" is checked
              setSelectedDataset(["All Datasets", ...availableDatasets]);
              await axios.post('http://localhost:3001/set_selected_datasets', {
                datasets: availableDatasets, // Send all datasets
              });
            } else {
              // Deselect all datasets when "All Datasets" is unchecked
              setSelectedDataset([]);
              await axios.post('http://localhost:3001/set_selected_datasets', {
                datasets: [], // Send an empty array to the backend
              });
            }
          }}
          sx={{ padding: '.3px' }}
        />
        <ListItemText primary="All Datasets" />
      </MenuItem>
      <Divider />
      {/* Individual datasets */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0px' }}>
        {availableDatasets.map((dataset) => (
          <MenuItem
            key={dataset}
            value={dataset}
            sx={{
              fontSize: '0.5rem',
              display: 'flex',
              alignItems: 'center',
            }}
            disabled={selectedDataset.includes("All Datasets")} // Disable individual items if "All Datasets" is selected
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={selectedDataset.includes(dataset)} // Check individual datasets
              onChange={async (e) => { // Marked as async
                const updatedDatasets = e.target.checked
                  ? [...selectedDataset, dataset] // Add the selected dataset
                  : selectedDataset.filter((item) => item !== dataset); // Remove the unselected dataset

                // If the selection is empty, send an empty array
                if (updatedDatasets.length === 0) {
                  setSelectedDataset([]);
                  await axios.post('http://localhost:3001/set_selected_datasets', {
                    datasets: [], // Send empty array when nothing is selected
                  });
                } else {
                  setSelectedDataset(updatedDatasets);
                  await axios.post('http://localhost:3001/set_selected_datasets', {
                    datasets: updatedDatasets, // Send the updated dataset list
                  });
                }
              }}
              sx={{ padding: '.3px' }}
            />
            <ListItemText primary={dataset} />
          </MenuItem>
        ))}
      </Box>
    </Select>
  </Box>






      {/* Type Dropdown */}
      <Box sx={{ width: '10%' , mr: 3 }}>
        <Select
          multiple
          value={selectedType}
          onChange={(e) => {const {
            target: { value },
          } = e;
          setSelectedType(
            typeof value === 'string' ? value.split(',') : value
          );
        }}
          displayEmpty
          fullWidth
          sx={{ height: '30px', fontSize: '0.8rem', backgroundColor: 'white', borderRadius: 1 }}
          renderValue={(selected) => {
            if (!selected) {
              return <em>Platform</em>;  // Display 'Type' as placeholder when nothing is selected
            }
            return 'Platform';
          }}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 300, // Controls max height of dropdown
              },
            },
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left',
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left',
            },
            getContentAnchorEl: null, // Ensures dropdown opens below the select box
          }}
        >
          <MenuItem disabled value="">
            <em>Spatial Transcriptomics</em>
          </MenuItem>
          {['10X Visium', 'Slide-Seq', 'DBit-Seq'].map((type) => (
          <MenuItem key={type} value={type} sx={{ fontSize: '0.8rem' }}> {/* Smaller font size */}
              <Checkbox checked={selectedType.indexOf(type) > -1} sx={{ padding: '.1px' }}/>
              <ListItemText primary={type} />
        </MenuItem>
          ))}
        </Select>
      </Box>
      {/* Studies Dropdown */}
      <Box sx={{ width: '10%' }}>
        <Select
          multiple
          value={selectedStud}
          onChange={(e) => {const {
            target: { value },
          } = e;
          setSelectedStud(
            typeof value === 'string' ? value.split(',') : value
          );
        }}
          displayEmpty
          fullWidth
          sx={{ height: '30px', fontSize: '0.8rem', backgroundColor: 'white', borderRadius: 1 }}
          renderValue={(selected) => {
            if (!selected) {
              return <em>Studies</em>;  // Display 'Type' as placeholder when nothing is selected
            }
            return 'Studies';
          }}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 300, // Controls max height of dropdown
              },
            },
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left',
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left',
            },
            getContentAnchorEl: null, // Ensures dropdown opens below the select box
          }}
        >
          {["Andersson et al (Nat Comm, 2021)", 
          "Arora et al (Nat Comm 2023)", 
          "Barkley et al (Nat Gen, 2022)", 
          "Bassiouni et al (Canc Res, 2022)", 
          "Berglund et al (Nat Comm 2018)", 
          "Brooke et al (Gyn Onc Rep, 2022)", 
          "Cassier et al (Nat 2023)", 
          "Chen et al (Biorxiv, 2023)", 
          "Cheng et al (J Immun Canc 2022)", 
          "Coutant et al (Lab Invest 2023)", 
          "Davidson et al (Canc Res, 2023)", 
          "Denisenko et al (Nat Comm 2024)", 
          "Erickson et al (Nat, 2022)", 
          "Fu et al (Neuro Onc 2023)", 
          "Ganier et al (PNAS 2024)", 
          "Greenwald (Zenodo, 2023)", 
          "Guo et al (Clin Trans Med 2023)", 
          "Ji et al (Cell, 2020)", 
          "Liu et al (Nat Comm, 2022)", 
          "Loh et al (Comm Bio 2023)",
          "Lyubetskaya (Cell rep med, 2022)", 
          "Makino et al (Canc Disc, 2023)", 
          "Matigan et al (NPJ Prec onc 2023)", 
          "Moeyersoms et al (Cancers 2023)", 
          "Moncada et al (Nat Biotech, 2020)", 
          "Pavel et al (BMC Gen 2023)", 
          "Ravi et al (Canc Cell, 2022)", 
          "Riemondy et al (Acta Neuro Comm 2023)", 
          "Shankar et al (Zenodo 2023)", 
          "Sudmeier et al (Cell Rep Med, 2022)",
          "Tokura et al (Canc Res 2022)", 
          "Tran et al (Front Immun, 2022)", 
          "Valdeolivas et al (Biorxiv 2023)", 
          "Visium", 
          "Visium FFPE", 
          "Vo et al (Genome Med, 2023)", 
          "Wang et al (Cell Death Disc, 2023)", 
          "Watanabe et al (Int J Mol Sci, 2023)", 
          "Wei et al (Nat Biotech, 2022)", 
          "Wu et al (Nat Gen, 2021)", 
          "Zaharia et al (Cancers, 2022)", 
          "Zhang et al (Biorxiv, 2023)", 
          "Zhou et al (Nat Gen 2022)"].map((type) => (
            <MenuItem key={type} value={type} sx={{ fontSize: '0.3rem' }}> {/* Smaller font size */}
              <Checkbox checked={selectedStud.indexOf(type) > -1} sx={{ padding: '.3px' }}/>
              <ListItemText primary={type} />
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Box>


      </Collapse>


      </Container>
    </div>
  );
}








function MainApp() {
  return (
    <Router>
      <Routes>
        <Route path="/:sessionID?" element={<App />} />
        <Route path="/results/:sessionID?" element={<ResultsPage />} />
      </Routes>
    </Router>
  );
}

export default MainApp;