import React, { useEffect, useState, useRef} from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid'; 
import { Divider, AppBar, Slider, Dialog, DialogActions, DialogTitle, DialogContent, Checkbox, ListItemText, Toolbar,TextField, Select, MenuItem, Button, Container, Box, Grid, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, LinearProgress } from '@mui/material';

const ResultsPage = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false); // Manage modal open/close state
  const [originalGenes, setOriginalGenes] = useState([]); 
  const navigate = useNavigate();
  const [plotsSet1, setPlotsSet1] = useState([]);
  const [plotsSet2, setPlotsSet2] = useState([]);
  const [plotsSet3, setPlotsSet3] = useState([]);
  const [genes, setGenes] = useState([]);
  const [plotPage, setPlotPage] = useState(1); // State for plot pagination
  const [genePage, setGenePage] = useState(1); // State for gene list pagination
  const [searchTerm, setSearchTerm] = useState(location.state?.searchTerm || ''); // State for search term
  const [isLoading, setIsLoading] = useState(false);
  const [geneSearchTerm, setGeneSearchTerm] = useState(''); // New state for gene search
  const [progress, setProgress] = useState(0); // State for tracking progress
  const [plotWidth, setPlotWidth] = useState(3); // Default width for plots
  const [plotHeightFactor, setPlotHeightFactor] = useState(3.15); // Default height factor
  const [dotSize, setDotSize] = useState(1); // Default dot size
  const [colorMap, setColorMap] = useState('Reds'); // Default color map
  const [dotSize2, setDotSize2] = useState(1); // Default dot size for second row
  const [outlineThickness, setOutlineThickness] = useState(1); // Default thicknes
  const [sortOrder, setSortOrder] = useState('asc'); // Tracks whether sorting is ascending or descending
  const rowsPerPage = 100;
  const plotsPerPage = 10; // Number of plots to show before scrolling
  const [raceInformation, setRaceInformation] = useState({});
  const [openFilter, setOpenFilter] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState([]); 
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
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState([]);
  const [selectedStud, setSelectedStud] = useState([]);
  const geneListRef = useRef(null);  // Ref for the gene list container
  const imageContainerRef = useRef(null);  // Ref for the image container
  const {sessionID} = useParams();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleOpenFilter = () => {
    setOpenFilter(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const handleCloseFilter = () => {
    setOpenFilter(false);
  };

  const toggleFilterExpansion = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };

  useEffect(() => {
    
    console.log('Generated or retrieved sessionID:', sessionID);

    }, [navigate, sessionID]);




  useEffect(() => {
    const savedDotSize = localStorage.getItem('dotSize');
    const savedColorMap = localStorage.getItem('colorMap');
    const savedDotSize2 = localStorage.getItem('dotSize2');
    const savedOutlineThickness = localStorage.getItem('outlineThickness');

    if (savedDotSize) setDotSize(parseFloat(savedDotSize));
    if (savedColorMap) setColorMap(savedColorMap);
    if (savedDotSize2) setDotSize2(parseFloat(savedDotSize2));
    if (savedOutlineThickness) setOutlineThickness(parseFloat(savedOutlineThickness));
  }, [open]); // Load settings each time dialog opens


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
    const socket = io('http://localhost:3001');

    // Listen for progress updates from the backend
    socket.on('progress', (data) => {
      setProgress(Math.max(5,data.progress));
    
    });

    socket.on('processingComplete', (data) => {
      if (data && data.message) {
        console.log(data.message);// Safely access the message property
        fetchCustomization();
        fetchPlots();
        fetchGeneList();
        fetchRaceInformation(); 
      } else {
        console.log('Processing complete without message');
      }
    });

  
    return () => {
      socket.disconnect();
    };

  }, []);

  const fetchCustomization = async () => {
    try {
      const response = await axios.get('http://localhost:3001/get_customization');
      const customization = response.data;
  
      // Set the customization options from the response
      setPlotWidth(customization.plotWidth);
      setPlotHeightFactor(customization.plotHeightFactor);
      setDotSize(customization.dotSize);
      setColorMap(customization.cmap);
      console.log('Current customization:', customization);
    } catch (error) {
      console.error('Error fetching customization:', error);
    }
  };

  const fetchGeneList = async () => {
    try {
      const timestamp = Date.now();
      const response = await axios.get(`http://localhost:3001/output.gene.list_${sessionID}.txt?v=${timestamp}`);
      const geneList = response.data.split('\n').filter(gene => gene.trim() !== '');
      setOriginalGenes(geneList); // Store original order
      setGenes(geneList); // Initially display the original list
    } catch (error) {
      console.error('Error fetching gene list:', error);
    }
  };

  const fetchRaceInformation = async () => {
    try {
      const response = await axios.get('http://localhost:3001/race_information.txt');
      const rows = response.data.split('\n').filter(row => row.trim() !== ''); // Split by newlines, remove empty rows
  
      const raceInfoMap = {};
      rows.forEach(row => {
        // First, split by tabs
        let columns = row.split('\t');
  
        if (columns.length < 8) return; // Skip rows with missing columns
  
        // Extract the first 6 columns and the last one (8th)
        const datasetName = columns[0]; // GSM.ID
        const col1to6 = columns.slice(0, 6); // First 6 columns
        const lastColumn = columns[columns.length - 1]; // The last column (Overall Survival)
  
        // Now, join the rest of the columns into the 7th column (Tx)
        const seventhColumn = columns.slice(6, columns.length - 1).join(' '); // Join the treatment-related columns into one
  
        // Reformat the info with the correct column order
        const info = `${col1to6.join(' | ')} | ${seventhColumn} | ${lastColumn}`;
        
        // Map dataset name to its information
        raceInfoMap[datasetName] = info;
      });
  
      // Store the mapping in the state
      setRaceInformation(raceInfoMap);
      console.log('Race information fetched:', raceInfoMap);
    } catch (error) {
      console.error('Error fetching race information:', error);
    }
  };

  const fetchPlots = async () => {
    try {
      // Fetch image list for plots from the first set
      const response1 = await axios.get(`http://localhost:3001/output_plots_list_${sessionID}.txt`);
      const images1 = response1.data.split('\n').filter(img => img.trim() !== '');
      
      // Now each 'img' is the filename; we convert it to the full image URL
      const imageUrlsSet1 = images1.map(img => `http://localhost:3001/output_plots_${sessionID}/${img}`);
      setPlotsSet1(imageUrlsSet1); // Store the actual URLs for the images
      
      // Convert filenames to URLs
      const imageUrlsSet2 = images1.map(img => `http://localhost:3001/output_plots_2_${sessionID}/${img}`);
      setPlotsSet2(imageUrlsSet2); // Store the URLs for the second set
      
      //Convert filenames to URLs
      const imageUrlsSet3 = images1.map(img => `http://localhost:3001/output_heatmaps_${sessionID}/${img}`);
      setPlotsSet3(imageUrlsSet3); // Store the URLs for the second set
      
    } catch (error) {
      console.error('Error fetching plot images:', error);
    }
  };

  // Handle plot page change
  const handlePlotPageChange = (event, newPage) => {
    setPlotPage(newPage);
  };

  // Handle gene page change
  const handleGenePageChange = (event, newPage) => {
    setGenePage(newPage);
  };

  const handleDatasetChange = (event) => {
    setSelectedDataset(event.target.value); // Update selected dataset

  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setIsLoading(true);
    setProgress(5); // Reset progress at the start

    

    const data = {
      searchTerm: searchTerm.trim(),     // The search term
      selectedDatasets: selectedDataset,  // The array of selected datasets
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

  const handleSortByFoldChange = () => {
    if (sortOrder === 'asc') {
      // If current order is ascending, switch to descending
      const sortedGenes = [...genes].sort((a, b) => parseFloat(b.split(/\s+/)[2]) - parseFloat(a.split(/\s+/)[2]));
      setGenes(sortedGenes);
      setSortOrder('desc');
    } else if (sortOrder === 'desc') {
      // If current order is descending, reset to original
      setGenes(originalGenes);
      setSortOrder(null);
    } else {
      // Default or null order, switch to ascending
      const sortedGenes = [...genes].sort((a, b) => parseFloat(a.split(/\s+/)[2]) - parseFloat(b.split(/\s+/)[2]));
      setGenes(sortedGenes);
      setSortOrder('asc');
    }
  };



  const handleCustomizationSubmit = async () => {
    try {
      // Send customization data to the backend and store it
      await axios.post('http://localhost:3001/customize_plots', {
        plotWidth,
        plotHeightFactor,
        dotSize,
        colorMap, // Make sure colorMap is sent
        dotSize2,         // Send dot size for second row
        outlineThickness  // Send outline thickness for second row
      });
  
      console.log('Customization data sent:', {
        plotWidth,
        plotHeightFactor,
        dotSize,
        colorMap,
        dotSize2,
        outlineThickness,
      });

      localStorage.setItem('dotSize', dotSize);
      localStorage.setItem('colorMap', colorMap);
      localStorage.setItem('dotSize2', dotSize2);
      localStorage.setItem('outlineThickness', outlineThickness);

      // Start the processing using the saved customization data
      const response = await axios.post('http://localhost:3001/start_processing' , {sessionID});
  
      if (response && response.data && response.data.message) {
        console.log(response.data.message);
      }

      handleClose();

    } catch (error) {
      console.error('Error applying customization:', error);
      setIsLoading(false);
    }
    
  };
  const handleFilterSubmit = async () => {
    try {
      setIsLoading(true);
      // Send the selected dataset filenames to the backend
      await axios.post('http://localhost:3001/set_selected_datasets', {
        datasets: selectedDataset, // Send the selected dataset filenames
      });
  
      console.log("Selected datasets sent:", selectedDataset); // Debugging statement
      console.log('Selected Type:', selectedType);
      // Close the filter section after submission
      setIsFilterExpanded(false);
      setIsLoading(false); 
    } catch (error) {
      console.error('Error sending selected datasets:', error);
    }
  };

/* const handleFilterSubmit = async () => {
    try {
      setIsLoading(true); // Show loading spinner while fetching images
  
      // Fetch images for the first dataset list file
      const responseSet1 = await axios.get('http://localhost:3001/get_dataset_images', {
        params: { dataset: selectedDataset } // e.g., 'gsm.list' or 'gsm.list.10'
      });
  
      // Fetch images for the second dataset list file
      const responseSet2 = await axios.get('http://localhost:3001/get_dataset_images_2', {
        params: { dataset: selectedDataset } // e.g., 'gsm.list' or 'gsm.list.10'
      });
  
      // Prepend the correct base URL (localhost:3001) to the image URLs for both sets
      const updatedImageUrlsSet1 = responseSet1.data.map(url => `http://localhost:3001${url}`);
      const updatedImageUrlsSet2 = responseSet2.data.map(url => `http://localhost:3001${url}`);
  
      console.log("First Set Image URLs received:", updatedImageUrlsSet1); // Debug the first set
      console.log("Second Set Image URLs received:", updatedImageUrlsSet2); // Debug the second set
  
      // Update the state with the image URLs for both sets
      setPlotsSet1(updatedImageUrlsSet1);
      setPlotsSet2(updatedImageUrlsSet2);
  
      handleCloseFilter(); // Close the modal after submission
      setIsLoading(false); // Hide loading spinner
    } catch (error) {
      console.error('Error fetching dataset images:', error);
      setIsLoading(false); // Hide loading spinner
    }
  };
*/

const handleScrollSync = (sourceRef, targetRef) => {
  if (sourceRef.current && targetRef.current) {
    targetRef.current.scrollTop = sourceRef.current.scrollTop;
  }
}; 

  useEffect(() => {
    const geneListElement = geneListRef.current;
    const imageContainerElement = imageContainerRef.current;

    // Listen for scroll events and sync the scroll positions
    const syncGeneListScroll = () => handleScrollSync(geneListRef, imageContainerRef);
    const syncImageScroll = () => handleScrollSync(imageContainerRef, geneListRef);

    if (geneListElement && imageContainerElement) {
      geneListElement.addEventListener('scroll', syncGeneListScroll);
      imageContainerElement.addEventListener('scroll', syncImageScroll);
    }

    // Cleanup the event listeners when the component unmounts
    return () => {
      if (geneListElement) geneListElement.removeEventListener('scroll', syncGeneListScroll);
      if (imageContainerElement) imageContainerElement.removeEventListener('scroll', syncImageScroll);
    };
  }, []);

  useEffect(() => {
  const scrollElements = document.querySelectorAll('.scroll-sync');
  const storedDatasets = localStorage.getItem('selectedDatasets');
  
  if (storedDatasets) {
    setSelectedDataset(JSON.parse(storedDatasets));
  }

  scrollElements.forEach(el => {
    el.addEventListener('scroll', (e) => {
      const scrollLeft = e.target.scrollLeft;
      scrollElements.forEach(otherEl => {
        if (otherEl !== e.target) {
          otherEl.scrollLeft = scrollLeft; // Synchronize scroll position
        }
      });
    });
  });


    fetchCustomization(); // Fetch the updated customization settings
    fetchRaceInformation();
    fetchPlots(); // Fetch the updated plot images
    fetchGeneList();


    return () => {
      // Cleanup event listeners on unmount
      scrollElements.forEach(el => {
        el.removeEventListener('scroll', () => {});
      });
    };


  }, []); 


  useEffect(() => {
    if (selectedDataset.length > 0) {
      localStorage.setItem('selectedDatasets', JSON.stringify(selectedDataset));
    } else {
      localStorage.removeItem('selectedDatasets');
    }
  }, [selectedDataset]);

  const indexOfLastPlot = plotPage * plotsPerPage;
  const indexOfFirstPlot = indexOfLastPlot - plotsPerPage;
  //const currentPlotsSet1 = plotsSet1.slice(indexOfFirstPlot, indexOfLastPlot);
  //const currentPlotsSet2 = plotsSet2.slice(indexOfFirstPlot, indexOfLastPlot);

  const filteredGenes = genes.filter(gene => gene.toLowerCase().includes(geneSearchTerm.toLowerCase()));

  const currentPlotsSet1 = plotsSet1.slice((plotPage - 1) * plotsPerPage, plotPage * plotsPerPage);
  const currentPlotsSet2 = plotsSet2.slice((plotPage - 1) * plotsPerPage, plotPage * plotsPerPage);

  const currentPlotsSet3 = plotsSet3.slice((plotPage - 1) * plotsPerPage, plotPage * plotsPerPage);


  // Handle changes for plot size and color

  // Calculate the genes to display based on the current gene page
  const indexOfLastGene = genePage * rowsPerPage;
  const indexOfFirstGene = indexOfLastGene - rowsPerPage;
  const displayedGenes = filteredGenes.slice(indexOfFirstGene, indexOfLastGene);

  const totalPlotPages = Math.max(Math.ceil(plotsSet1.length / plotsPerPage), Math.ceil(plotsSet2.length / plotsPerPage));
  const totalGenePages = Math.ceil(genes.length / rowsPerPage);



  return (
    <>
<AppBar position="static" sx={{ width: '100%', p: 2 , overflowX: 'hidden' }}>
  <Toolbar sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
    {/* First Row: Image and Search Bar */}
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', mb: 0 }}> {/* Reduced margin-bottom */}
      {/* Image of baylor.png placed at the top left */}
      <Box sx={{ display: 'flex', alignItems: 'center',  flexShrink: 0 }}>
        <img src="/logoo.png" alt="Baylor Logo" style={{ height: '60px', marginLeft: '0px', marginRight: '10px' }} />
      </Box>
      
      {/* Search Bar */}
      <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', alignItems: 'center', width: '100%', mt: 2 }}>
        <TextField
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search..."
          variant="outlined"
          size="small"
          sx={{ backgroundColor: 'white', borderRadius: 2 }}
        />
        <Button type="submit" variant="contained" color="primary" sx={{ ml: 2 }} disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Search'}
        </Button>
      </Box>
    </Box>





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


  </Toolbar>
</AppBar>

    <Container>

    {/*--------------------------------------------------------------------------------------------------*/}

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

      <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', mb: 1, mt:1 }}>

        {/* Customize Button */}
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleOpen} 
          sx={{
            position: 'relative',
            ml: 1, // Add some left margin if needed
          }}
        >
          Customize
        </Button>

        {/* Pagination in the Center */}
        <Box sx={{ display: 'flex', justifyContent: 'left', flexGrow: 1, ml:40 }}>
          <Pagination
            count={totalPlotPages}
            page={plotPage}
            onChange={handlePlotPageChange}
            color="primary"
          />
        </Box>

      </Box>

      {/* Dialog for Customization Options */}
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Customize Plots</DialogTitle>
        <DialogContent>
          <Container>
            <Box sx={{ my: 4 }}>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography>Dot Size (Set 1): {dotSize}</Typography>
                  <Slider
                    value={dotSize}
                    min={0.5}
                    max={10}
                    step={0.1}
                    onChange={(e, newValue) => setDotSize(newValue)}
                  />
                </Grid>
                <Grid item xs={3}>
                  <Typography>Color Map</Typography>
                  <Select
                    value={colorMap}
                    onChange={(e) => setColorMap(e.target.value)}
                    fullWidth
                  >
                    <MenuItem value="Reds">Red</MenuItem>
                    <MenuItem value="Blues">Blue</MenuItem>
                    <MenuItem value="Greens">Green</MenuItem>
                    <MenuItem value="Oranges">Orange</MenuItem>
                    <MenuItem value="viridis">Viridis</MenuItem>
                    <MenuItem value="rainbow">Rainbow</MenuItem>
                    <MenuItem value="plasma">Plasma</MenuItem>
                    <MenuItem value="cividis_r">cividis</MenuItem>
                  </Select>
                </Grid>
                <Grid item xs={3}>
                  <Typography>Dot Size (Set 2): {dotSize2}</Typography>
                  <Slider
                    value={dotSize2}
                    min={0.5}
                    max={10}
                    step={0.1}
                    onChange={(e, newValue) => setDotSize2(newValue)}
                  />
                </Grid>
                <Grid item xs={3}>
                  <Typography>Outline Thickness (Set 2): {outlineThickness}</Typography>
                  <Slider
                    value={outlineThickness}
                    min={0.1}
                    max={5}
                    step={0.1}
                    onChange={(e, newValue) => setOutlineThickness(newValue)}
                  />
                </Grid>
              </Grid>
            </Box>
          </Container>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">Cancel</Button>
          <Button onClick={handleCustomizationSubmit} variant="contained" color="primary">Apply Customization</Button>
        </DialogActions>
      </Dialog>


      



      {/* Scatter plots with pagination */}
    <Box sx={{ overflowX: 'scroll', whiteSpace: 'nowrap', mb: 0, mt:0 }}>


      <Box  sx={{ display: 'inline-flex', flexDirection: 'column', overflowX: 'scroll' }}>
      {/*<Typography variant="h5" sx={{ textAlign: 'left', mb: 1 }}>Query Expression</Typography>*/}
        <Box sx={{ display: 'flex', mb: 1 }}>
        <Box sx={{ width: '120px', marginRight: '10px', position: 'relative' }}>
        Query <br></br>Expression
        </Box>
      {currentPlotsSet1.map((imgUrl, index) => {
        // Extract the dataset name from the image URL (assuming file name is like "GSM6433597.png")
        const datasetName = imgUrl.split('/').pop().split('.')[0]; // Extract filename and remove the extension
        const raceInfo = raceInformation[datasetName] || datasetName; // Get race information or fall back to dataset name
        const timestamp = Date.now(); // Use current timestamp for cache busting

        return (
          <Box key={index} sx={{ textAlign: 'center', marginRight: '1px' }}>
            {/* Display the extracted race information */}
            <Typography variant="body2" sx={{ marginBottom: '0px', fontSize: '9px'}}>
              {`${raceInformation[datasetName]?.split('|')[0]} | ${raceInformation[datasetName]?.split('|')[1]} 
              | ${raceInformation[datasetName]?.split('|')[2]} | ${raceInformation[datasetName]?.split('|')[3]} 
              | ${raceInformation[datasetName]?.split('|')[4]} | ${raceInformation[datasetName]?.split('|')[5]}
              | ${raceInformation[datasetName]?.split('|')[7]}
              `}
            </Typography>

        {/* Display the second part of the race information (the 6th column) on a new line */}
        <Typography variant="body2" sx={{ marginBottom: '0px', fontSize: '10px' }}>
            {raceInformation[datasetName]?.split('|')[6] === ' None '
              ? 'None'
              : `${raceInformation[datasetName]?.split('|')[6]?.substring(0, 35)}...`}
        </Typography>
                    
            {/* Add cache-busting timestamp to the image URL */}
            <img
              src={`${imgUrl}?v=${timestamp}`}
              alt={`Plot Set 1 - ${index}`}
              style={{ width: '200px', height: '280px' }}
            />
          </Box>
        );
      })}
    </Box>
    
    {/* <Typography variant="h5" sx={{ textAlign: 'left', mb: 0 }}>Co-localized Spots</Typography>*/}
    <Box sx={{ display: 'flex' }}>
      <Box sx={{ width: '120px', marginRight: '10px', position: 'relative' }}>
    Co-localized <br></br>Spots
        </Box>
    {currentPlotsSet2.map((imgUrl, index) => {
      // Extract the dataset name from the image URL (assuming file name is like "GSM6433625.png")
      const datasetName = imgUrl.split('/').pop().split('.')[0]; // Extract filename and remove the extension
      const timestamp = Date.now(); // Use current timestamp for cache busting

    return (
      <Box key={index} sx={{ textAlign: 'center', marginRight: '1px' }}>
        {/* Display the extracted dataset name */}
        {/* Add cache-busting timestamp to the image URL */}
        <img
          src={`${imgUrl}?v=${timestamp}`}
          alt={`Plot Set 2 - ${index}`}
          style={{ width: '200px', height: '245px' }}
        />
      </Box>
    );
    })}
    </Box>
  </Box>


        {/* Gene Search Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, justifyContent: 'space-around' }}>
        <Typography variant="h7" sx={{ textAlign: 'left', mb: 1 }}>Gene List</Typography>
            <TextField
            value={geneSearchTerm}
            onChange={(e) => setGeneSearchTerm(e.target.value)}
            placeholder="Search..."
            variant="outlined"
            size="small"
            sx={{ width: '200px' }}  
          />
            <Pagination
            count={totalGenePages}
            page={genePage}
            onChange={(event, value) => setGenePage(value)}
            sx={{ mt: 0, mr:50, display: 'flex' }}
          />
        </Box>


        
        {/* Gene List Column */}

        

      {/* Flexbox container to position gene list and table side by side */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mt: 0 }}>
      {/* Gene List and Scores Container */}
      <Box
        ref={geneListRef}  // Attach the ref to the gene list container
        sx={{ display: 'flex', maxWidth: '108px', flexDirection: 'row', maxHeight: '88vh', overflowY: 'auto', position: 'relative', flexShrink: 0 }}
      >
        {/* Rank Column */}
        <Box sx={{ width: '30px', marginRight: '10px', position: 'relative' }}>
          <Typography variant="h7">Rank</Typography>
          {displayedGenes.map((gene, index) => (
            <Typography key={index} variant="body2" sx={{ lineHeight: 1 }}>
              {gene.split(/\s+/)[0]} {/* Display only the gene name */}
            </Typography>
          ))}
        </Box>

        {/* Score2 Column */}
        <Box sx={{ width: '80px', marginRight: '10px', position: 'relative' }}>
          <Typography variant="h7">Score</Typography>
          {displayedGenes.map((gene, index) => (
            <Typography key={index} variant="body2" sx={{ lineHeight: 1 }}>
              {!isNaN(parseFloat(gene.split(/\s+/)[3])) ? parseFloat(gene.split(/\s+/)[3]).toFixed(2) : 'N/A'}
            </Typography>
          ))}
        </Box>

        {/* Gene List Column */}
        <Box sx={{ width: '100px', marginRight: '20px', position: 'relative' }}>
          <Typography variant="h7">Gene</Typography>
          {displayedGenes.map((gene, index) => (
            <Typography key={index} variant="body2" sx={{ lineHeight: 1 }}>
              {gene.split(/\s+/)[1]} {/* Display only the gene name */}
            </Typography>
          ))}
        </Box>
      </Box>

      {/* Main Table - Image Container */}
      <Box
        ref={imageContainerRef}  // Attach the ref to the image container
        sx={{ flexGrow: 1, display: 'inline-flex', flexDirection: 'column', ml: 2, height: '88vh', overflowY: 'auto' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, mt: 1.8 }}>
          <Box sx={{ display: 'flex' }}>
            {currentPlotsSet3.map((imgUrl, index) => {
              const datasetName = imgUrl.split('/').pop().split('.')[0];
              const timestamp = Date.now(); // Cache busting

              return (
                <Box key={index} sx={{ textAlign: 'center', marginRight: '1px' }}>
                  <img
                    src={`${imgUrl}?v=${timestamp}`}
                    alt={`Plot Set 2 - ${index}`}
                    style={{ width: '200px', height: '1392px' }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>
    </Box>


      </Box>


  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, mb: 8 }}>
    <Button 
      variant="contained" 
      sx={{ width: '200px', height: '50px', fontSize: '18px', textTransform: 'none', // Dark gray color
        lineHeight: '1.2',}} // Adjust the width, height, and font size
    >
      Biological Process Enrichment
    </Button>
    <Button 
      variant="contained" 
      sx={{ width: '200px', height: '50px', fontSize: '18px' ,   textTransform: 'none',// Dark gray color
        }} // Same adjustments
    >
      Cell-type Specificity
    </Button>
    <Button 
      variant="contained" 

      sx={{ width: '200px', height: '50px', fontSize: '18px' ,  textTransform: 'none', // Dark gray color
          lineHeight: '1.2',}} // Same adjustments
    >
      Ligand-Receptor Analysis
    </Button>
  </Box>


  {/* Empty box below the buttons */}
  <Box sx={{ height: '100px' }} />


  </Container>
    </>
    
  );
};



export default ResultsPage;

