import { Component, OnInit, ViewChild } from '@angular/core';
import { UserDataService } from '../../core/services/user.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { validacionesCampos } from '../../shared/validacionesCampos';
import { PacientesService } from '../../core/services/pacientes.service';
import { constantesGlobales, ValidacionesRegex } from '../../shared/global.constants';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatButtonModule,
    CommonModule,
    MatIconModule,
  ],
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css']
})
export class PacientesComponent implements OnInit {
  altaPacienteForm: FormGroup;
  busquedaForm: FormGroup;
  hide = true;
  datosCargados: any;
  idelement: number = 0;
  mensajeError: string = '';
  mensajeExito: string = '';
  listaPacientes: any[] = [];
  displayedColumns: string[] = ['idPaciente', 'nombre', 'curp','genero', 'seguro','telefono', 'estado', 'fecha', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  userData: any;

  constructor(
    private pacientesService: PacientesService,
    private fb: FormBuilder,
  ) {
    this.busquedaForm = this.fb.group({
      search: ['']
    });

    this.busquedaForm.get('search')?.valueChanges.subscribe(value => {
      if (value === null || value === undefined || value === '') {
        this.buscar();
      }
    });
    this.altaPacienteForm = this.fb.group({
      nombre: ['', Validators.required],
      apellidoPat: ['', Validators.required],
      apellidoMat: [''],
      telefono: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]], // Agrupa los validadores en un array
      genero: ['0', Validators.required],
      seguro: ['', Validators.required],
      curp: ['', Validators.required]
    });    
  }

  ngOnInit(): void {
    console.log("entrando en el componente pacientes");
    this.cargaPacientes();
    this.cargaFiltros();
  }
  
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  cargaPacientes(): void{
    this.pacientesService.obtenerPacientes().subscribe({
      next: data => {
        console.log('Respuesta del API:', data);
        this.listaPacientes = data;
        this.dataSource.data = this.listaPacientes;
        this.actualizarTabla();
      },
      error: error => console.error('Error al obtener personal:', error)
    });
  }

  cargaFiltros():void {
    // Configura el filtro para que funcione en múltiples campos
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const transformedFilter = filter.trim().toLowerCase();
      console.log('dta',data);
      // Busca en todos los campos relevantes
      const matchId = data.ID_PACIENTE.toString().includes(transformedFilter);
      const matchNombre = data.NOMBRE.toLowerCase().includes(transformedFilter);
      const matchApPat = data.APELLIDO_PATERNO.toLowerCase().includes(transformedFilter);
      const matchAPMat= data.APELLIDO_MATERNO.toLowerCase().includes(transformedFilter);
      const matchCurp = data.CVE_CURP.toString().includes(transformedFilter);

      // Retorna true si el filtro coincide con alguno de los campos
      return matchId || matchNombre || matchCurp || matchAPMat || matchApPat;
    };
  }

  // Función para aplicar el filtro
  buscar() {
    const criterio = this.busquedaForm.get('search')?.value || ''; // Asegúrate de que no sea null
    this.dataSource.filter = criterio.trim().toLowerCase(); // Aplica el filtro en minúsculas
  }

  alta_Pacientes(): void {
    if (this.altaPacienteForm.valid) {
      this.mensajeExito = "";
      this.mensajeError = "";

      // Preparar el JSON con los datos del formulario
      const dataPaciente = {
        CVE_CURP: this.altaPacienteForm.value.curp,
        NOMBRE: this.altaPacienteForm.value.nombre,
        APELLIDO_PATERNO: this.altaPacienteForm.value.apellidoPat,
        APELLIDO_MATERNO: this.altaPacienteForm.value.apellidoMat,
        CVE_SEGURO: this.altaPacienteForm.value.seguro,
        CVE_SEXO: this.altaPacienteForm.value.genero,
        TELEFONO:this.altaPacienteForm.value.telefono,
        ACTIVO: true
      };
      console.log('Formulario enviado con éxito:', dataPaciente);

      // Llamar al servicio para registrar el horario
      this.pacientesService.crearPaciente(dataPaciente).subscribe({
        next: (response) => {
          console.log('Horario creado con éxito:', response);
          this.mensajeExito = 'Paciente registrado con éxito';
          this.mensajeError = '';

          // Limpiar el formulario
          this.limpiarFormulario();

          // Actualizar la lista de pacientes
          this.cargaPacientes();
        },
        error: (error) => {
          console.error('Error en el alta del paciente:', error);
          this.mensajeError = 'Ocurrió un error al dar de alta al paciente, por favor intente de nuevo.';
          this.mensajeExito = '';
        }
      });
    } else {
      this.validarFormulario();
    }
  }

  validarFormulario(): void {
    const validaciones = validacionesCampos(this.altaPacienteForm);
    this.mensajeError = validaciones.mensajeError;
    this.mensajeExito = validaciones.mensajeExito;
  }

  limpiarFormulario() {
    this.altaPacienteForm.reset();
    this.altaPacienteForm.patchValue({
      seguro: "",
      genero: 0
    });
  }

  eliminar(element: any): void {
    // Cambiar el estado del elemento localmente
    const nuevoEstado = { ACTIVO: false };

    // Llamar al servicio para actualizar el estado en la base de datos
    this.pacientesService.actualizarPaciente(this.idelement, nuevoEstado).subscribe({
      next: (respuesta) => {
        console.log('Horario actualizado correctamente:', respuesta);

        // Actualizar la tabla para reflejar los cambios
        this.cargaPacientes();
      },
      error: (error) => {
        console.error('Error al actualizar el estado del horario:', error);
        // Manejar el error (mostrar un mensaje o algo similar)
      }
    });
  }

  actualizarRegistro(){
    console.log('Actualizar estado de:', this.altaPacienteForm.value);
    console.log('id del elemento:', this.idelement);
    this.mensajeExito = "";
    this.mensajeError = "";
    if (this.altaPacienteForm.valid) {
      if (this.datosCargados === this.altaPacienteForm.value) {
        this.mensajeError = constantesGlobales.ERROR_SIN_CAMBIO
      } else {
        // Preparar el JSON con los datos del formulario
        const dataPaciente = {
          CVE_CURP: this.altaPacienteForm.value.curp,
          NOMBRE: this.altaPacienteForm.value.nombre,
          APELLIDO_PATERNO: this.altaPacienteForm.value.apellidoPat,
          APELLIDO_MATERNO: this.altaPacienteForm.value.apellidoMat,
          CVE_SEGURO: this.altaPacienteForm.value.seguro,
          CVE_SEXO: this.altaPacienteForm.value.genero,
          TELEFONO:this.altaPacienteForm.value.telefono,
        };
        /*/ Llamar al servicio para actualizar el estado en la base de datos*/
        this.pacientesService.actualizarPaciente(this.idelement, dataPaciente).subscribe({
          next: (respuesta) => {
            console.log('Paciente actualizado correctamente:', this.listaPacientes);
            this.mensajeExito = constantesGlobales.EXITO_ACTUALIZACION;
            this.cargaPacientes();
          },
          error: (error) => {
            if (error.message === constantesGlobales.ERROR_DATOS_SIN_CAMBIO) {
              console.log(constantesGlobales.ERROR_SIN_CAMBIO);
              this.mensajeError = constantesGlobales.ERROR_SIN_CAMBIO
            } else {
              console.error('Ocurrió un error al actualizar el paciente:', error);
              this.mensajeError = `Ocurrió un error al actualizar el paciente: ${error}`;
            }
          }
        });
      }
    } else {
      this.validarFormulario();
    }
  }

  cargarDatos(element: any): void{
    this.idelement = element.ID_PACIENTE
    this.altaPacienteForm.setValue({
      nombre: element.NOMBRE,
      apellidoPat: element.APELLIDO_PATERNO,
      apellidoMat: element.APELLIDO_MATERNO,
      telefono: element.TELEFONO,
      genero: element.CVE_SEXO,
      seguro: element.CVE_SEGURO,
      curp: element.CVE_CURP,
    });
    this.datosCargados = this.altaPacienteForm.value;
  }

  actualizarTabla(): void {
    // Filtrar los horarios que estén activos
    this.dataSource.data
      .sort((a, b) => {
        // Ordenar por FECHA_REGISTRO en orden descendente (los más nuevos primero)
        return new Date(b.FECHA).getTime() - new Date(a.FECHA).getTime();
      });
  }

}
